# Railway live-access attempt — BLOCKED (real, recorded)

Date: 2026-07-24T19:56:32Z
Target: https://crafthub360.up.railway.app

This sandbox has no outbound network route to the live Railway deployment.
The attempts below are the real commands and their real, unedited output.
No live Railway screenshot, deployed-commit check, or live build-ID reading
exists in this proof directory, because none could be obtained. Nothing here
is simulated.

```
$ curl -sS -m 25 -o /dev/null -w 'http_code=%{http_code}' https://crafthub360.up.railway.app/api/version
curl: (56) CONNECT tunnel failed, response 403
http_code=000
```

```
$ curl -sS -m 25 -o /dev/null -w 'http_code=%{http_code}' https://crafthub360.up.railway.app/smokecraft/leaderboard
curl: (56) CONNECT tunnel failed, response 403
http_code=000
```

```
$ curl -sS -m 25 -o /dev/null -w 'http_code=%{http_code}' https://crafthub360.up.railway.app/system/build-info
curl: (56) CONNECT tunnel failed, response 403
http_code=000
```

