# NALA Menu Manager

NALA Menu Manager is a browser app I built for the MAST5112 Portfolio of Evidence. It lets restaurant staff and guests browse the menu, search dishes, place orders with a cart and checkout flow, track receipts, and keep menu items and profile details up to date.

The app is built with React, TypeScript, Vite, and Firebase. It runs in a web browser; it is not a React Native or Expo app.

## Project details

| | |
|---|---|
| Student | Hlompho Muzi Xolo |
| Student number | ST10476575 |
| Module | MAST5112 — Portfolio of Evidence |
| Repository | [44Xolo/NALA-ASSIGNMENT-1](https://github.com/44Xolo/NALA-ASSIGNMENT-1) |
| Demo | [Watch the app demo](https://youtube.com/shorts/nESHh-IQ8Hs?feature=share) |

## What you can do

- Browse the dishes on the menu and open any item to see its description, prep time, and ingredients.
- Search by dish name and filter the list by course.
- Add available dishes to a cart straight from the menu cards or the dish detail screen, adjust quantities, and pick a tip.
- Check out for dine-in, collection, or delivery and pay by card, instant EFT, or at the counter or table.
- View digital receipts and follow order progress from confirmed to preparing, ready, and completed on the Orders tab.
- Add and edit dishes, mark items available or unavailable, delete dishes with confirmation or undo, and restore the original sample menu.
- Check menu totals, average prices, prices by course, availability figures, and the cheapest and most expensive dishes.
- Log in or sign up with email and password, a phone number (SMS code), or Google.
- View and edit your chef profile details (name, role, restaurant, specialty, years of experience, bio, and contact details) in Settings.

## Run the app

Install [Node.js](https://nodejs.org/) and npm, then run:

```sh
npm install
npm run dev
```

Open the local address printed by Vite. The layout works on both phone and desktop browser screens.

## Run the checks

```sh
npm run typecheck
npm test
npm run build
```

The tests cover menu search and filtering, statistics, saved menu data, form validation, login and profile validation, cart totals and checkout card validation, and the Firestore security rules.

## Project structure

```text
src/
  components/      Shared UI components, cards, forms, error boundary, and bottom navigation
  data/            Sample menu data
  hooks/           Menu state, filtering, cart, orders, Firebase auth, and user profile hooks
  lib/             Firebase initialization and Firestore error helpers
  screens/         Login, menu, detail, cart, checkout, orders, manage, form, stats, and settings screens
  utils/           Formatting, filtering, stats, form validation, ordering helpers, and auth error messages
  types.ts         Shared TypeScript types
public/images/     Dish and restaurant images
firestore.rules    Cloud Firestore security rules for profiles and orders
```

All application source code (`src/`), test files, and main project configs (`vite.config.ts`, `tailwind.config.ts`, `build-types.d.ts`) are written in TypeScript and pass `tsc -b`. Only `postcss.config.js` and `eslint.config.js` use plain JavaScript because those tools expect standard JS config files.

## Data and limitations

User accounts, chef profiles (`users/{userId}`), and placed orders (`orders/{orderId}`) use Firebase Authentication and Cloud Firestore, protected by `firestore.rules`. If someone signs up with email and password and has not verified their email yet, profile edits and orders stay saved in browser storage on that device until they verify their email.

Menu items and the active shopping cart are saved in local browser storage on the same device.

Card payments at checkout are checked in the browser (Luhn number check, future expiry date, and CVV length) rather than charging a live payment gateway. Full card numbers and CVVs are never saved; only the last four digits or the selected bank or counter option appear on the receipt. You cannot upload photos for new menu items.

## Known login issues

The TypeScript check, Vite build, and test suite all pass, but the login and sign-up page still depends on manual settings in the Firebase console for project `lexical-silicon-jf900`:

- **Email/password and phone sign-in return `auth/operation-not-allowed`:** Only Google sign-in is turned on by default. Email/Password and Phone must be switched on manually under **Authentication → Sign-in method** in the Firebase console.
- **Preview URLs can hit `auth/unauthorized-domain` or popup blocks:** Hosted preview domains (like `*.run.app`) must be added under **Authentication → Settings → Authorized domains** in the Firebase console, and browser popups must be allowed for Google sign-in.
- **Email verification for cloud sync:** New email/password accounts must click the verification link sent to their inbox and press **I've verified** in Settings before Cloud Firestore will accept profile and order writes.
- **Phone SMS codes:** Real SMS delivery needs Phone Auth quota or test phone numbers set up in Firebase, plus an authorized domain for reCAPTCHA.

## Change log

These are the main changes made since Part 2:

- **18 November 2026:** Added a full ordering, cart, checkout, and receipt flow. Guests can add available dishes from the menu or detail screen, adjust quantities and tips in the cart, choose dine-in, collection, or delivery, pay via card (with Luhn and expiry checks), instant EFT, or at the counter, and track order progress on the Orders tab with Cloud Firestore sync.
- **18 November 2026:** Added Firebase Authentication to the login screen with separate Log in and Sign up modes for email/password, phone SMS codes, and Google sign-in, along with friendly error messages and input validation.
- **18 November 2026:** Brought back the Settings tab with a chef profile card, editable profile form, email verification status banner, active menu count, and Cloud Firestore sync for verified accounts.
- **18 November 2026:** Added Firestore security rules (`firestore.rules`), data schemas (`firebase-blueprint.json`), an app error boundary, and unit tests for auth validation, ordering calculations, and security rules.
- **18 November 2026:** Updated Vite, TypeScript, and package settings for port 3000 preview hosting, and documented the remaining Firebase console setup steps needed on the login page.
- **14 November 2026:** Added editing and deletion, with validation, a confirmation step, and immediate updates.
- **14 November 2026:** Added dish-name search and course filtering, including a clear button.
- **14 November 2026:** Added menu totals, average price, and item counts by course.
- **16 November 2026:** Added undo for deleted dishes and an option to restore the sample menu.
- **16 November 2026:** Added average prices by course, availability figures, and lowest and highest prices.
- **16 November 2026:** Added automated tests for search, filtering, statistics, and form validation.
- **14–16 November 2026:** Improved validation and feedback messages, and clarified empty states.
- **14 November 2026:** Reworked the project into strict TypeScript and separated components, screens, hooks, utilities, and data.
- **16 November 2026:** Converted configuration files to TypeScript and removed `.env` and generated build files from Git.
- Removed the cart, ordering pages, Settings, and Google sign-in from the Part 2 prototype before they were rebuilt with Firebase on 18 November 2026.

## References

- Apple (n.d.) *Human Interface Guidelines*. Available at: https://developer.apple.com/design/human-interface-guidelines/ (Accessed: 12 October 2026).
- Biørn-Hansen, A., Grønli, T. and Ghinea, G. (2020) 'A survey and taxonomy of core concepts and research challenges in cross-platform mobile development', *ACM Computing Surveys*, 53(5), pp. 1–39.
- Boduch, A. and Derks, R. (2023) *React and React Native: Build cross-platform JavaScript applications with native power for mobile, web and desktop*. 4th edn. Packt Publishing.
- diagrams.net (n.d.) *Diagramming and whiteboarding*. Available at: https://www.diagrams.net/ (Accessed: 12 October 2026).
- Eisenberg, A. (2022) *Learning React Native: Building Native Mobile Apps with JavaScript*. 2nd edn. O'Reilly Media.
- Figma (n.d.) *Figma*. Available at: https://www.figma.com/ (Accessed: 12 October 2026).
- Google (n.d.) *Material Design 3*. Available at: https://m3.material.io/ (Accessed: 12 October 2026).
- React Native (n.d.) *Documentation*. Available at: https://reactnative.dev/docs/getting-started (Accessed: 12 October 2026).
- Walker, J. R. (2021) *The Restaurant: From Concept to Operation*. 8th edn. Wiley.
