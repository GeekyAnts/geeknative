# Playbook: bug

1. **Locate.** Find which app has the bug, and whether that app breaks the spec or the spec never covered this case.
2. **If the spec was silent or wrong,** fix the spec first (add the missing state or rule, with an acceptance criterion), then fix every app that doesn't match it. A bug in one app often exists in the others.
3. **If the spec was right,** fix the app that breaks it, then check the other two apps for the same mistake.
4. **Add a regression test** named after the acceptance criterion it protects, in each app you fixed.
5. **Verify** with `make check` for every app you touched, and report which apps had the bug.
