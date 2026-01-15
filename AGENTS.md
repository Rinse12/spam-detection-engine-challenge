- If you update the code and it differs than our spec at README.md, ask me if we need to update the spec to follow the implementation

- Make sure to run npm run build after you're done coding and make sure it passes. Run it for all packages

- Both challenges and http server engine will be run in nodejs environment and never in browser.
- When you add a feature make sure to add tests to test that feature using vitest.
- If there's a bug then you should reproduce it with a test and then fix it in code, then run the test and make sure it passes.
- If there's schema to be shared between challenges package and http server and engine it should be stored in the shared directory
- DO NOT DUPLICATE PLEBBIT-js schemas or types, just import them from plebbit-js
- keep in mind that subplebbit.address can be a domain, and in that case if we need to get its public key we need to resolve it using plebbit-js library
- In general there should not be a need for dynamic imports, static imports should work
