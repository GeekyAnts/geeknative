# Playbook: platform-specific change

Use when the user names a platform ("on Android, ...", "iOS only").

1. **Check it's really platform-only.** Platform conventions (haptics, share sheets, widgets, keyboard shortcuts on web) belong on one platform. A product change that merely happens to be described for one platform probably belongs on all three. If unsure, ask once.
2. **Record it** in the feature's "Platform notes" if users can see it, so nobody "fixes" the difference later. For a feature that exists on only some platforms, set the others to `n/a` in its front matter.
3. **Implement and verify** on that platform only, with `make check-<platform>`.
4. **Report** that the change is intentionally limited to that platform.
