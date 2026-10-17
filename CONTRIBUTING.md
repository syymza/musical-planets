# Contributing

All changes go through a pull request, including documentation and maintenance.
Keep this repository public. Do not push directly to `main`.

1. Create a focused branch from the latest `main`.
2. Make the smallest useful change and run the checks in the README.
3. Open a PR against `main`. Explain the problem, the change, and the checks you ran.
4. For visual or interaction changes, include desktop and phone screenshots or a short recording. Check keyboard access and reduced motion. State any browsers or devices you did not test.
5. Wait for CI and maintainer review. Merge and publication require maintainer approval.

GitHub Pages publishes `main` from the repository root. A PR does not deploy the site; merging changes to `main` can publish them. CI checks source and documentation and has no deployment permissions.

Keep credentials, `.env` files, private notes, local recordings, archives and machine-specific paths out of commits. Share only screenshots intended for the public repository. Never rewrite published history as routine cleanup.

For a bug report, include the browser/device, steps to reproduce, expected behavior and actual behavior. For sound issues, distinguish browser emulation from listening on a physical device.

No project license has been selected. Please discuss reuse or a license change with the owner rather than assuming permission.
