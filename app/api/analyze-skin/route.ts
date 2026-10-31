import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const YOUCAM_BASE_URL = "https://yce-api-01.makeupar.com/s2s/v2.0";

type YouCamFileResponse = {
  data?: {
    files?: Array<{
      file_id?: string;
      requests?: Array<{
        url?: string;
        headers?: Record<string, string>;
      }>;
    }>;
  };
  error?: string;
};

type YouCamTaskResponse = {
  data?: {
    task_id?: string;
    task_status?: string;
    results?: {
      output?: Array<{
        type?: string;
        ui_score?: number;
        raw_score?: number;
        mask_urls?: string[];
      }>;
    };
  };
  error?: string;
};

type NormalizedAnalysis = {
  moisture: number;
  redness: number;
  texture: number;
  wrinkles: number;
  radiance: number;
  skinAge: number;
  overallScore: number;
  masks: {
    moisture?: string;
    redness?: string;
    texture?: string;
    wrinkles?: string;
    radiance?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.YOUCAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing YOUCAM_API_KEY. Add it to .env.local and restart the server.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a valid selfie image." },
        { status: 400 }
      );
    }

    const contentType = image.type || "image/jpeg";

    if (!["image/jpeg", "image/jpg", "image/png"].includes(contentType)) {
      return NextResponse.json(
        { error: "Only JPG, JPEG, or PNG images are supported." },
        { status: 400 }
      );
    }

    if (image.size >= 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be smaller than 10MB." },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const initializedFile = await initializeYouCamUpload(
      apiKey,
      contentType,
      image.name || "menomorph-selfie.jpg",
      imageBuffer.byteLength
    );

    await uploadImageToYouCam(
      initializedFile.uploadUrl,
      initializedFile.uploadHeaders,
      imageBuffer
    );

    const taskId = await createSkinAnalysisTask(
      apiKey,
      initializedFile.fileId
    );

    const analysis = await pollSkinAnalysisTask(apiKey, taskId);

    if (!analysis) {
      return NextResponse.json(
        { error: "Skin analysis timed out. Please try again." },
        { status: 504 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("MenoMorph skin analysis error:", error);

    return NextResponse.json(
      { error: "Unable to complete skin analysis. Please try again." },
      { status: 500 }
    );
  }
}

async function initializeYouCamUpload(
  apiKey: string,
  contentType: string,
  fileName: string,
  fileSize: number
): Promise<{
  fileId: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
}> {
  const response = await fetch(`${YOUCAM_BASE_URL}/file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: [
        {
          content_type: contentType,
          file_name: fileName,
          file_size: fileSize,
        },
      ],
    }),
  });

  const data = (await response.json()) as YouCamFileResponse;

  if (!response.ok) {
    console.error("YouCam file initialization failed:", data);
    throw new Error(data.error || "Could not initialize the YouCam upload.");
  }

  const file = data.data?.files?.[0];
  const uploadRequest = file?.requests?.[0];
  const fileId = file?.file_id;
  const uploadUrl = uploadRequest?.url;
  const uploadHeaders = uploadRequest?.headers ?? {};

  if (!fileId || !uploadUrl) {
    throw new Error("YouCam did not return an upload destination.");
  }

  return {
    fileId,
    uploadUrl,
    uploadHeaders,
  };
}

async function uploadImageToYouCam(
  uploadUrl: string,
  uploadHeaders: Record<string, string>,
  imageBuffer: Buffer
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body: new Uint8Array(imageBuffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("YouCam image upload failed:", errorText);
    throw new Error("Could not upload the selfie to YouCam.");
  }
}

async function createSkinAnalysisTask(
  apiKey: string,
  fileId: string
): Promise<string> {
  const response = await fetch(`${YOUCAM_BASE_URL}/task/skin-analysis`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: ["moisture", "redness", "texture", "wrinkle", "radiance"],
      miniserver_args: {
        enable_mask_overlay: true,
      },
      format: "json",
    }),
  });

  const data = (await response.json()) as YouCamTaskResponse;

  if (!response.ok) {
    console.error("YouCam task creation failed:", data);
    throw new Error(data.error || "Could not create the skin-analysis task.");
  }

  const taskId = data.data?.task_id;

  if (!taskId) {
    throw new Error("YouCam did not return a task ID.");
  }

  return taskId;
}

async function pollSkinAnalysisTask(
  apiKey: string,
  taskId: string
): Promise<NormalizedAnalysis | null> {
  const maxAttempts = 60;
  const delayMs = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const response = await fetch(
      `${YOUCAM_BASE_URL}/task/skin-analysis/${taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = (await response.json()) as YouCamTaskResponse;

    if (!response.ok) {
      console.error("YouCam polling failed:", data);
      return null;
    }

    const taskStatus = data.data?.task_status;

    console.log(
      `YouCam task ${attempt + 1}/${maxAttempts}: ${taskStatus ?? "unknown"}`
    );

    if (taskStatus === "success") {
      return normalizeYouCamResponse(data);
    }

    if (taskStatus === "error") {
      console.error("YouCam skin analysis failed:", data);
      return null;
    }
  }

  return null;
}

function normalizeYouCamResponse(
  data: YouCamTaskResponse
): NormalizedAnalysis {
  const output = data.data?.results?.output ?? [];

  const findResult = (type: string) =>
    output.find((item) => item?.type === type);

  const getScore = (type: string) => {
    const result = findResult(type);
    return Math.round(result?.ui_score ?? result?.raw_score ?? 0);
  };

  const getMask = (type: string) => {
    const result = findResult(type);
    return result?.mask_urls?.[0];
  };

  return {
    moisture: getScore("moisture"),
    redness: getScore("redness"),
    texture: getScore("texture"),
    wrinkles: getScore("wrinkle"),
    radiance: getScore("radiance"),
    skinAge: 0,
    overallScore: 0,
    masks: {
      moisture: getMask("moisture"),
      redness: getMask("redness"),
      texture: getMask("texture"),
      wrinkles: getMask("wrinkle"),
      radiance: getMask("radiance"),
    },
  };
}