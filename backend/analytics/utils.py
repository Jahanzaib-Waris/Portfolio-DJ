import hashlib
from datetime import date


def client_ip(request):
    """Best-effort client IP, honoring X-Forwarded-For behind Vercel's proxy.

    Only used to build the same-day session hash below, not for throttling
    (DRF's own NUM_PROXIES setting handles that) — so this doesn't need to be
    spoof-proof, just good enough to dedupe repeat views from one visitor.
    """

    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def session_key_for(request):
    """A same-day hash of (IP, User-Agent) — rotates daily so it can't be used
    to track a visitor across days, but still groups same-day repeat views."""

    raw = f"{client_ip(request)}:{request.META.get('HTTP_USER_AGENT', '')}:{date.today().isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]
