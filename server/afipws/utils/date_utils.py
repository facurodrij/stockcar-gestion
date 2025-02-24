import time
from datetime import datetime, timezone


def date(fmt=None, timestamp=None):
    "Manejo de fechas (simil PHP)"
    if fmt == "U":  # return timestamp
        # use localtime to later convert to UTC timezone
        t = datetime.now()
        return int(time.mktime(t.timetuple()))
    if fmt == "c":  # return isoformat
        # use universal standard time to avoid timezone differences
        d = datetime.fromtimestamp(timestamp, timezone.utc)
        return d.isoformat()
    if fmt == "Ymd":
        d = datetime.now()
        return d.strftime("%Y%m%d")
