# MenoMorph AI

### Changing skin. More confident choices.

MenoMorph AI is a menopause-aware skincare discovery prototype that
connects YouCam Skin Analysis with explainable product screening,
routine suggestions, and product selection.

Built for the YouCam API Skin AI & eCommerce VTO Hackathon.

## Project Links

- Live application: https://menomorph-ai-xj5l.vercel.app/
- Demo video: https://youtu.be/hGIuf-mXtDg
- Devpost submission: https://devpost.com/submit-to/31400-youcam-api-skin-ai-ecommerce-vto-hackathon/manage/submissions/1269778-menomorph-ai/additional-info/edit

## The Problem

Choosing skincare can feel confusing when skin needs change during a
life stage such as perimenopause or menopause.

A generic product catalog does not connect a person's skin-analysis
results, self-reported experiences, and product choices. MenoMorph
explores how to make that journey easier to understand.

## The Solution

MenoMorph connects three steps:

1. Upload a selfie for YouCam Skin Analysis.
2. Review skin insights and explanations for product-screening flags.
3. Explore routine suggestions, select products, and see a basket total.

The goal is to move beyond displaying scores and demonstrate how skin
insights can support a clearer product-discovery experience.

## Features

### YouCam Skin Analysis

- Upload a JPG or PNG selfie.
- Send the image through a server-side integration.
- Create and poll a YouCam skin-analysis task.
- Display the results mapped by the application.
- Support concern-mask visualization when a compatible mask is returned.

### Explainable Product Screening

- Apply transparent prototype rules to the current skin metrics.
- Show which catalog ingredients matched the application's watchlist.
- Explain why a product is flagged or excluded from selection.

These are illustrative product-screening rules, not medically validated
contraindications or guarantees of product safety.

### Routine Suggestions

- Group catalog products into morning and evening suggestions.
- Exclude products marked as blocked by the prototype rules.
- Update suggestions when the current metrics change.

Routine suggestions are separate from the user's selected-product
basket. Suggestions are not a prescription or an instruction to use
every listed product together.

### Product Selection

- Add and remove products using the catalog controls.
- Display the number of selected products.
- Calculate the total from unique selected product IDs.

### Wellness Logger

- Record self-reported hot flashes, sleep quality, and observations.
- Attach a snapshot of the current skin metrics to each entry.
- Keep entries in component memory for the current session.

### Responsive Interface

- A mobile-first dashboard layout.
- Product cards that adapt to available screen width.
- Mobile navigation for viewing the routine.
- Session-reset controls.

## Consumer Value

MenoMorph aims to make skincare discovery easier to understand.

Instead of presenting only a score or an unexplained recommendation,
the prototype shows the relationship between current skin metrics,
product-screening rules, ingredient matches, routine suggestions,
and product cost.

The wellness logger also gives users a place to record their own
experiences alongside the current skin snapshot.

These are intended benefits of the prototype, not outcomes established
through a user study or clinical trial.

## Retail Value

MenoMorph demonstrates a guided path from skin analysis to product
consideration:

Selfie → Skin insights → Screening explanation → Routine suggestions
→ Selected-product basket

For a retailer, this illustrates how a generic catalog could become
a more contextual discovery experience, with explanations next to
product choices and a visible selection total.

The current prototype does not measure conversion, sales, return rates,
or clinical outcomes.

## YouCam API Integration

The application uses YouCam Skin Analysis.

The server-side workflow is:

1. Receive an image from the browser.
2. Initialize an upload with YouCam.
3. Upload the image to the returned upload destination.
4. Create a skin-analysis task.
5. Poll the task until completion or failure.
6. Normalize the returned data for the dashboard.

The API credential is read on the server from:

YOUCAM_API_KEY

The browser calls the local route:

POST /api/analyze-skin

The browser does not receive the API key.

### Important Result-Interpretation Notes

- The displayed composite index is calculated by MenoMorph's prototype
  formula; it is not presented as a clinically validated assessment.
- Rule thresholds are illustrative application settings.
- Changing sliders manually changes prototype inputs; those values
  should not be presented as fresh YouCam measurements.
- A task marked successful still requires correct result-field mapping.
- Missing results must not be interpreted as proof of healthy skin.
- Skin-age estimation is not implemented in this version.
- Any retained skin-age placeholder is not an actual age estimate.

## Technology

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- YouCam Skin Analysis API

## Local Setup

### Requirements

- Node.js compatible with the Next.js version in package.json.
- npm.
- A YouCam API credential with access to the required Skin Analysis
  features and sufficient available usage.

### 1. Download the project

Clone this repository or download its ZIP archive.

Open a terminal in the folder containing package.json.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the API key

Create a file named .env.local in the project root, beside package.json.

```env
YOUCAM_API_KEY=your_actual_youcam_api_key
```

Do not place this file inside app/.

Do not prefix this secret with NEXT_PUBLIC_.

Do not commit the real key to Git.

### 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Check the production build

```bash
npm run build
```

To run a successful production build locally:

```bash
npm run start
```

## Testing the Prototype

1. Open the application.
2. Upload a clear, front-facing JPG or PNG selfie that you have permission
   to use.
3. Wait for analysis to complete.
4. Check the returned metrics.
5. Check any available concern overlay.
6. Review the product-screening explanations.
7. Add and remove products.
8. Confirm that the selection count and total update.
9. Save a wellness entry.
10. Test the reset control.

For a manual rule demonstration, move moisture below 45 and redness
above 50. Explain that this is a manually configured scenario, not a
new analysis of the uploaded face.

## Troubleshooting

### Missing YOUCAM_API_KEY

- Check that .env.local is beside package.json.
- Check the variable name.
- Save the file and restart the development server.

### No face detected

Upload a clearer, front-facing selfie with unobstructed facial features.
A successful upload does not guarantee the image passes face detection.

### Analysis fails or appears to time out

Read the terminal error before retrying. An upstream task failure must
not be mistaken for a processing timeout.

### All scores are zero or masks are missing

Inspect the successful YouCam response and verify the normalization
logic against the returned structure. Zero defaults are not evidence
that an analysis found no concerns.

## Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Use the detected Next.js framework settings.
3. Add YOUCAM_API_KEY as a server-side environment variable.
4. Deploy or redeploy after adding the variable.
5. Test a real scan on the deployed application.
6. Confirm that judges can open the production URL without logging in.

The local .env.local file is not automatically transferred to Vercel.

## Privacy and Security

- Uploaded selfies are sent to YouCam for processing.
- Use only images you own or have permission to process.
- The supplied application code does not intentionally persist uploaded
  selfies in a project database.
- This does not make a claim about the API provider's retention practices.
- Wellness entries and product selections are held in session memory
  and are lost on refresh.
- Do not commit API keys, private photos, or personal health information.
- Avoid logging full image responses or signed URLs in a public demo.
- The public demo is not hardened for production-scale use.

## Current Limitations

- The product catalog, brands, prices, and ingredient lists are
  demonstration data, not verified retailer inventory.
- Screening rules are not clinically validated.
- Ingredient matching uses a small, exact-match watchlist; it is not a
  comprehensive ingredient interaction, allergy, or formulation checker.
- The app cannot determine estrogen levels, diagnose menopause, or
  diagnose skin disease from a selfie.
- Product suggestions do not guarantee suitability or safety.
- Routine suggestions may include multiple options within a category.
- Selected products and suggested routines are separate.
- No user accounts or persistent history are implemented.
- Virtual try-on is not integrated; any related tab or button is a
  placeholder.
- Checkout, payments, fulfillment, and retailer integration are not
  implemented.
- Analysis time and availability depend on the external API.
- Production deployment requires further validation, privacy work,
  access controls, and abuse protection.

## Future Work

- Verify and strengthen result normalization and missing-value handling.
- Add source-supported, professionally reviewed screening guidance.
- Improve routine ordering and select one product per routine step.
- Revalidate selected products when the skin profile changes.
- Add consent-based persistent history.
- Integrate real retailer inventory.
- Integrate virtual try-on.
- Conduct usability and accessibility testing.

## Medical Disclaimer

MenoMorph AI is a cosmetic wellness and retail-discovery prototype.
It is not a medical device and does not provide medical diagnosis,
prescriptions, or treatment advice.

Seek appropriate professional care for concerning or persistent symptoms.

## License and Third-Party Services

Original project code is provided under the MIT License.
See LICENSE.

Third-party dependencies retain their own licenses.
YouCam APIs, service access, branding, and outputs are governed by
their applicable terms and are not relicensed by this repository.

## Author

Oyetunde Daniel
