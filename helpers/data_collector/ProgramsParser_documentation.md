# ProgramsParser

## Overview

`ProgramsParser` is a web scraping class designed to collect, parse, and export academic study program data from the Lodz University of Technology's official programs portal ([programy.p.lodz.pl](https://programy.p.lodz.pl)). It fetches information about fields of study, their curricula by semester, subjects, and optionally detailed subject cards (lecturers, language, responsible unit). The final result is a structured JSON file.

---

## Import & Dependencies

```python
from ProgramsParser import ProgramsParser
```

**External dependencies:**
- `requests` — HTTP requests with retry strategy
- `beautifulsoup4` (`bs4`) — HTML parsing
- `csv`, `json`, `os`, `shutil`, `re`, `logging`, `time` — standard library

---

## Constructor

```python
ProgramsParser(
    module_dir: str,
    plans_dir: str,
    majors_filename: str,
    output: str,
    missed_filename: str = "missed.csv"
)
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `module_dir` | `str` | Root working directory. All paths are resolved relative to it. |
| `plans_dir` | `str` | Subdirectory (inside `module_dir`) where per-major CSV plan files will be stored. |
| `majors_filename` | `str` | Filename (inside `module_dir`) for the CSV listing all majors and their URLs. |
| `output` | `str` | Filename (inside `module_dir`) for the preliminary JSON output. A `final-` prefixed version is also produced after cleanup. |
| `missed_filename` | `str` | Filename for logging subject detail fetch failures. Defaults to `"missed.csv"`. |

### Internal State Set by Constructor

| Attribute | Description |
|---|---|
| `self.session` | `None` on init; set to a `requests.Session` when `get_programs()` is called. |
| `self.get_details` | `False` on init; controls whether subject detail cards are fetched. |
| `self.main_url` | Base URL: `https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true` |
| `self.headers` | Standard browser User-Agent header. |
| `self.adapter` | `HTTPAdapter` with exponential backoff retry (10 total retries, statuses 500/502/503/504). |
| `self.logger` | Python `logging.Logger` instance at `INFO` level. |

---

## Public Methods

### `get_programs()`

```python
get_programs(
    faculties: list[str] = None,
    clean: bool = True,
    get_details: bool = False,
    overwrite: bool = True,
    time_between_fos_sec: int = 0
) -> None
```

**The main entry point.** Orchestrates the entire scraping pipeline from start to finish.

#### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `faculties` | `list[str]` or `None` | `None` | List of faculty names to filter by. Pass `None` or `["all"]` to scrape all faculties. |
| `clean` | `bool` | `True` | If `True`, removes all temporary files and directories after completion. |
| `get_details` | `bool` | `False` | If `True`, fetches each subject's detail card (lecturer, language, organizational unit). Significantly increases runtime. |
| `overwrite` | `bool` | `True` | If `True`, overwrites the preliminary JSON file if it already exists. |
| `time_between_fos_sec` | `int` | `0` | Seconds to wait between processing individual fields of study. Use to avoid rate-limiting. Must be `>= 0`. |

#### Pipeline Steps (in order)

1. Initializes an HTTP session with retry adapter and browser headers.
2. Calls `get_majors_list()` — fetches the full list of majors from the portal.
3. Calls `get_plans_from_faculties(faculties)` or `get_plans_from_courses()` — downloads per-major plan CSV files.
4. Calls `parse_programs_to_json()` — parses all CSV plans into a preliminary JSON.
5. Calls `retry_missed_subjects()` — re-attempts failed subject detail fetches.
6. Calls `raport_and_clean_programs()` — removes empty majors and produces the `final-*.json` file.
7. Optionally calls `clean()`.

#### Example

```python
from ProgramsParser import ProgramsParser

pp = ProgramsParser(
    module_dir="helpers\\data_collector\\",
    plans_dir="plany\\",
    majors_filename="kierunki.csv",
    output="programs.json"
)

pp.get_programs(
    faculties=["Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki"],
    get_details=True,
    clean=True,
    overwrite=True,
    time_between_fos_sec=10
)
```

---

### `get_majors_list()`

```python
get_majors_list() -> None
```

Fetches the main page of the portal and scrapes the list of all available study programs. Saves the result to `majors_filename` as a CSV file with columns:

| Column | Description |
|---|---|
| `Kierunek` | Name of the major |
| `Link` | URL to the major's page |

---

### `get_majors_all_versions()`

```python
get_majors_all_versions(major: str, url: str, soup=None) -> None
```

For a given major, fetches all available academic year versions of its curriculum and saves them to a CSV file in `plans_dir`. The file is named after the sanitized major name.

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `major` | `str` | Name of the major (used as filename). |
| `url` | `str` | URL of the major's page. |
| `soup` | `BeautifulSoup` or `None` | Optional pre-parsed HTML. If `None`, the page is fetched fresh. |

**Output CSV columns:**

| Column | Description |
|---|---|
| `Nazwa` | Version/year label |
| `Wydzial` | Faculty name (from `<pre>` tag) |
| `Stopien` | Degree level (`1` = Bachelor's, `2` = Master's) |
| `Stacjonarne` | `True` if full-time studies, `False` if part-time |
| `Link` | Full URL to that specific curriculum version |

---

### `get_plans_from_courses()`

```python
get_plans_from_courses(start: int = 0, end: int = -1) -> None
```

Iterates over all rows in `majors_filename` and calls `get_majors_all_versions()` for each. Useful for scraping all faculties at once.

#### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `start` | `int` | `0` | Start index in the majors list. |
| `end` | `int` | `-1` | End index (exclusive). `-1` means process to the end. |

---

### `get_plans_from_faculties()`

```python
get_plans_from_faculties(faculties: list[str]) -> None
```

Same as `get_plans_from_courses()`, but filters majors by faculty name. Each major's page is briefly fetched to read the faculty name from the `<pre>` tag, and only those matching any entry in `faculties` are processed.

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `faculties` | `list[str]` | Faculty names to include. Matching is done with `in` (substring). |

---

### `get_majors_specialties()`

```python
get_majors_specialties(url: str) -> dict | None
```

Checks whether a major has specializations by looking for a `<select>` element on its page.

**Returns:** A `dict` mapping option values (specialty IDs) to their display names, or `None` if no specialties are found.

---

### `parse_major()`

```python
parse_major(url: str, faculty: str, specialty_name: str = None) -> dict | None
```

Parses a single curriculum page and extracts all structured data into a dictionary.

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `url` | `str` | Full URL to the curriculum page. |
| `faculty` | `str` | Faculty name to embed in the result. |
| `specialty_name` | `str` or `None` | Specialty name, if applicable. |

#### Returned Dictionary Structure

```json
{
  "nazwa": "Computer Science",
  "wydzial": "Faculty of Electrical, Electronic, Computer and Control Engineering",
  "stopien": 1,
  "stacjonarne": true,
  "specjalizacja": null,
  "od": "2025/2026",
  "url": "https://...",
  "semestry": [
    {
      "nazwa": "Semester 1",
      "przedmioty": [
        {
          "Kod przedmiotu": "...",
          "Nazwa przedmiotu": "...",
          "...(other table headers)": "...",
          "jednostka": "...",
          "kierownik": "...",
          "realizatorzy": ["Jan Kowalski"],
          "jezyk": "Polish"
        }
      ]
    }
  ]
}
```

> **Note:** The `jednostka`, `kierownik`, `realizatorzy`, and `jezyk` fields are only present when `get_details=True`. If fetching details fails, the subject is logged to `missed_filename` for later retry.

---

### `parse_programs_to_json()`

```python
parse_programs_to_json() -> None
```

Scans all CSV files in `plans_dir`, resolves specialties for each plan entry, and calls `parse_major()` for each version. Aggregates all results and saves them to `output_filename` as a preliminary JSON file.

---

### `retry_missed_subjects()`

```python
retry_missed_subjects() -> None
```

Reads `missed_filename` (if it exists) and re-attempts fetching detail cards for all subjects that failed during the initial run. Successfully recovered entries are patched directly into the output JSON. If all misses are recovered, `missed_filename` is deleted; otherwise it is rewritten with only the still-failed entries.

---

### `raport_and_clean_programs()`

```python
raport_and_clean_programs() -> None
```

Post-processing step that:

1. Loads the preliminary JSON output.
2. Logs statistics before cleaning: number of majors, semesters, and subjects.
3. Removes majors with no subjects in any semester.
4. Logs statistics after cleaning.
5. Saves the names and URLs of removed majors to `removed_empty_programs.csv` in `module_dir`.
6. Saves the cleaned dataset to `final-<output_filename>`.

---

### `clean()`

```python
clean() -> None
```

Deletes temporary files created during scraping:
- The `plans_dir` directory and all its contents.
- The `majors_filename` CSV file.

---

### `save_to_json()`

```python
save_to_json(data, filename: str, label: str) -> None
```

Utility method. Saves `data` as a formatted JSON file (UTF-8, `indent=4`, `ensure_ascii=False`).

---

### `pretty_wait()`

```python
pretty_wait(time_sec: int, bars: int = 10) -> None
```

Pauses execution for `time_sec` seconds and displays a simple progress bar in the terminal. Used between requests to avoid rate-limiting.

---

### `parse_link()`

```python
parse_link(url: str) -> str
```

Helper that URL-encodes spaces in a URL by replacing `" "` with `"%20"`.

---

## Output Files

| File | Description |
|---|---|
| `<module_dir>/<majors_filename>` | CSV: all majors and their portal URLs |
| `<module_dir>/<plans_dir>/<major>.csv` | CSV: all curriculum versions per major |
| `<module_dir>/<missed_filename>` | CSV: subjects whose detail pages failed to fetch |
| `<module_dir>/<output>` | JSON: preliminary scraped data (before cleanup) |
| `<module_dir>/final-<output>` | JSON: final cleaned dataset (main deliverable) |
| `<module_dir>/removed_empty_programs.csv` | CSV: majors removed due to having no subjects |

---

## JSON Output Schema

The `final-<output>.json` file is a JSON array where each element represents one field of study / specialization / year combination:

```
Array of:
  {
    nazwa        : string   — Major name
    wydzial      : string   — Faculty name
    stopien      : integer  — Degree level (1 = Bachelor's, 2 = Master's)
    stacjonarne  : boolean  — True if full-time
    specjalizacja: string | null — Specialization name
    od           : string   — Academic year (e.g. "2025/2026")
    url          : string   — Source URL
    semestry     : Array of:
      {
        nazwa      : string — Semester name
        przedmioty : Array of:
          {
            Kod przedmiotu : string — Subject code
            Nazwa ...      : string — (all table columns from the curriculum page)
            jednostka      : string — Organizational unit (if get_details=True)
            kierownik      : string — Subject coordinator (if get_details=True)
            realizatorzy   : Array<string> — Lecturers (if get_details=True)
            jezyk          : string — Language of instruction (if get_details=True)
          }
      }
  }
```

---

## Error Handling & Retry Logic

- **HTTP retries:** All requests use an `HTTPAdapter` with up to 10 retries, exponential backoff (`backoff_factor=2`), and retry on status codes 500, 502, 503, 504.
- **Subject detail failures:** If fetching a subject's detail card fails, the subject is appended to `missed_filename` and the scraper continues without interruption.
- **Automatic retry pass:** After the main scraping loop, `retry_missed_subjects()` is automatically called to recover failed subjects.
- **Logging:** All significant events (progress, warnings, errors) are logged via Python's `logging` module at `INFO`/`WARNING`/`ERROR` levels.

---

## Notes

- The scraper targets the `wersja202526=true` version of the portal. If the portal structure changes, HTML selectors may need updating.
- Setting `get_details=True` substantially increases execution time due to one additional HTTP request per subject.
- Use `time_between_fos_sec` to add deliberate delays between fields of study and reduce the risk of being blocked by the server.
