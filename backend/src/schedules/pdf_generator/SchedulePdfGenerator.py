import os
from datetime import time
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

from src.schedules.pdf_generator.models import Lesson, Day, Schedule

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

FONT_REG_PATH = os.path.join(CURRENT_DIR, "DejaVuSans.ttf")

try:
    if not os.path.exists(FONT_REG_PATH):
        raise FileNotFoundError(f"Didn't find file: {FONT_REG_PATH}")

    pdfmetrics.registerFont(TTFont("DejaVu", FONT_REG_PATH))
    pdfmetrics.registerFont(TTFont("DejaVu-Bold", FONT_REG_PATH))

    FONT_REG = "DejaVu"
    FONT_BOLD = "DejaVu-Bold"
    print("SUCCESS: Loaded DejaVuSans!")

except Exception as e:
    print(f"FONT ERROR: {e}.")
    FONT_REG = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"


class SchedulePdfGenerator:
    def __init__(self):
        self.buffer = BytesIO()
        self.c = canvas.Canvas(self.buffer, pagesize=landscape(A4))
        self.width, self.height = landscape(A4)

        self.time_col_x = 25
        self.time_col_width = 45
        self.left_margin = self.time_col_x + self.time_col_width
        self.right_margin = 35
        self.top_margin = 80
        self.bottom_margin = 40

        self.days = list(Day)
        self.day_widths = {}

        self.num_rows = 12
        self.row_height = 0
        self.font_base = 8.0
        self.font_title = 9.0
        self.font_header = 8.0

    # =================================================
    # HELPERS
    # =================================================

    def time_to_grid_units(self, t: time) -> float:
        h = t.hour
        m = t.minute
        if m >= 15:
            fraction = (m - 15) / 45.0
            return float(h - 8) + fraction
        else:
            return float(h - 8)

    def get_grid_range(self, lesson: Lesson):
        return (
            self.time_to_grid_units(lesson.start_time),
            self.time_to_grid_units(lesson.end_time),
        )

    def overlaps(self, a: Lesson, b: Lesson):
        sa, ea = self.get_grid_range(a)
        sb, eb = self.get_grid_range(b)
        return not (ea <= sb or eb <= sa)

    def get_color_for_type(self, type_label):
        t = type_label.lower()
        if "w" in t:
            return colors.HexColor("#F5A623")
        elif "l" in t or "p" in t:
            return colors.HexColor("#00B5AD")
        elif "c" in t:
            return colors.HexColor("#B5B2FF")
        return colors.HexColor("#A0AEC0")

    def get_text_height(self, text, max_width, font, size):
        if not text:
            return 0
        self.c.setFont(font, size)
        words = text.split()
        lines = 1
        current = ""
        for w in words:
            test = current + " " + w if current else w
            if self.c.stringWidth(test, font, size) <= max_width:
                current = test
            else:
                lines += 1
                current = w
        return lines * (size + 1.5)

    def draw_wrapped_text(self, text, x, y_top_box, max_width, font, size):
        if not text:
            return 0
        self.c.setFont(font, size)
        words = text.split()
        lines = []
        current = ""
        for w in words:
            test = current + " " + w if current else w
            if self.c.stringWidth(test, font, size) <= max_width:
                current = test
            else:
                if current:
                    lines.append(current)
                current = w
        if current:
            lines.append(current)

        line_height = size + 1.5
        for i, line in enumerate(lines):
            self.c.drawString(x, y_top_box - size - (i * line_height), line)
        return len(lines) * line_height

    def group_into_lanes(self, cluster: list[Lesson]):
        lanes = []
        for lesson in cluster:
            placed = False
            for lane in lanes:
                if not any(self.overlaps(lesson, existing) for existing in lane):
                    lane.append(lesson)
                    placed = True
                    break
            if not placed:
                lanes.append([lesson])
        return lanes

    def compute_day_lane_counts(self, schedule: Schedule):
        counts = {}
        for day in self.days:
            day_lessons = [lesson for lesson in schedule.lessons if lesson.day == day]
            if not day_lessons:
                counts[day] = 1
                continue
            lanes = self.group_into_lanes(day_lessons)
            counts[day] = max(1, len(lanes))
        return counts

    # =================================================
    # DRAWING
    # =================================================

    def draw_grid(self):
        c = self.c

        c.setStrokeColor(colors.black)
        c.setLineWidth(1)
        c.rect(
            self.time_col_x,
            self.bottom_margin,
            self.width - self.time_col_x - self.right_margin,
            self.height - self.top_margin - self.bottom_margin,
        )

        for row in range(self.num_rows):
            y_top = self.height - self.top_margin - row * self.row_height
            y_bottom = y_top - self.row_height

            c.setStrokeColor(colors.lightgrey)
            if row > 0:
                c.line(self.time_col_x, y_top, self.width - self.right_margin, y_top)

            c.setFillColor(colors.black)
            c.setFont(FONT_REG, 9)

            sh, sm = row + 8, 15
            eh, em = row + 9, 0

            c.drawString(self.time_col_x + 3, y_top - 10, f"{sh:02d}:{sm:02d}")
            c.drawRightString(self.left_margin - 3, y_bottom + 4, f"{eh:02d}:{em:02d}")

        y_bottom_final = self.height - self.top_margin - self.num_rows * self.row_height
        c.setStrokeColor(colors.lightgrey)
        c.line(
            self.left_margin,
            y_bottom_final,
            self.width - self.right_margin,
            y_bottom_final,
        )

        c.setStrokeColor(colors.black)
        x = self.left_margin
        for day in self.days:
            day_w = self.day_widths.get(day, 100)
            c.setLineWidth(1)
            c.line(x, self.bottom_margin, x, self.height - self.top_margin)

            c.setFillColor(colors.black)
            c.setFont(FONT_BOLD, 12)
            c.drawCentredString(
                x + day_w / 2,
                self.height - self.top_margin + 10,
                day.pl_name,
            )
            x += day_w

    def draw_lessons(self, schedule: Schedule):
        c = self.c

        x_day_start = self.left_margin
        for day in self.days:
            day_w = self.day_widths.get(day, 100)
            day_lessons = [lesson for lesson in schedule.lessons if lesson.day == day]

            clusters = []
            for lesson in sorted(day_lessons, key=lambda x: self.get_grid_range(x)[0]):
                if not clusters:
                    clusters.append([lesson])
                else:
                    cluster = clusters[-1]
                    cluster_end = max(self.get_grid_range(x)[1] for x in cluster)
                    if self.get_grid_range(lesson)[0] < cluster_end:
                        cluster.append(lesson)
                    else:
                        clusters.append([lesson])

            for cluster in clusters:
                lanes = self.group_into_lanes(cluster)
                num_lanes = len(lanes)
                lane_width = day_w / num_lanes if num_lanes > 0 else day_w

                for lane_idx, lane in enumerate(lanes):
                    for lesson in lane:
                        x = x_day_start + lane_idx * lane_width
                        start_units, end_units = self.get_grid_range(lesson)
                        y_top = (
                            self.height
                            - self.top_margin
                            - start_units * self.row_height
                        )
                        y_bottom = (
                            self.height - self.top_margin - end_units * self.row_height
                        )
                        box_height = y_top - y_bottom

                        padding = 1.5
                        rx, ry, rw, rh = (
                            x + padding,
                            y_bottom + padding,
                            lane_width - 3,
                            box_height - 3,
                        )

                        c.setFillColor(colors.white)
                        c.setStrokeColor(self.get_color_for_type(lesson.type_label))
                        c.setLineWidth(1.5)
                        c.rect(rx, ry, rw, rh, fill=1, stroke=1)

                        header_text = f"{lesson.type_label} , {lesson.weeks}".strip()
                        needed_h = self.get_text_height(
                            header_text, rw - 4, FONT_BOLD, self.font_header
                        )

                        c.setFillColor(colors.HexColor("#F0F0F0"))
                        c.rect(
                            rx + 1,
                            ry + rh - needed_h - 3,
                            rw - 2,
                            needed_h + 1,
                            fill=1,
                            stroke=0,
                        )

                        c.saveState()
                        path = c.beginPath()
                        path.rect(rx, ry, rw, rh)
                        c.clipPath(path, stroke=0, fill=0)

                        c.setFillColor(colors.black)
                        cur_y = ry + rh - 2

                        self.draw_wrapped_text(
                            header_text,
                            rx + 2,
                            cur_y,
                            rw - 4,
                            FONT_BOLD,
                            self.font_header,
                        )
                        cur_y -= needed_h + 2

                        used_h = self.draw_wrapped_text(
                            lesson.subject,
                            rx + 2,
                            cur_y,
                            rw - 4,
                            FONT_REG,
                            self.font_title,
                        )
                        cur_y -= used_h + 1

                        c.setFont(FONT_BOLD, self.font_base)
                        if lesson.room:
                            c.drawString(rx + 2, cur_y - self.font_base, lesson.room)
                            cur_y -= self.font_base + 1

                        c.setFont(FONT_REG, self.font_base)
                        if lesson.teacher:
                            c.drawString(rx + 2, cur_y - self.font_base, lesson.teacher)

                        c.restoreState()

            x_day_start += day_w

    # =================================================
    # BUILD
    # =================================================

    def build(self, schedule: Schedule) -> BytesIO:
        counts = self.compute_day_lane_counts(schedule)

        for day in self.days:
            lessons = [lesson for lesson in schedule.lessons if lesson.day == day]
            num_lanes = max(1, counts.get(day, 1))

            max_lane_w = 110.0
            for lesson in lessons:
                words = (
                    lesson.subject.split()
                    + [lesson.room, lesson.teacher]
                    + f"{lesson.type_label} , {lesson.weeks}".split()
                )
                for w in words:
                    if w:
                        w_len = self.c.stringWidth(w, FONT_BOLD, self.font_title) + 12
                        if w_len > max_lane_w:
                            max_lane_w = w_len

            self.day_widths[day] = max_lane_w * num_lanes

        total_width = (
            self.left_margin + sum(self.day_widths.values()) + self.right_margin
        )

        self.width = max(landscape(A4)[0], total_width)

        max_row_height = 45.0
        for day in self.days:
            lessons = [lesson for lesson in schedule.lessons if lesson.day == day]
            day_w = self.day_widths[day]
            num_lanes = max(1, counts.get(day, 1))
            lane_w = day_w / num_lanes

            for lesson in lessons:
                header_text = f"{lesson.type_label} , {lesson.weeks}".strip()

                header_h = self.get_text_height(
                    header_text, lane_w - 6, FONT_BOLD, self.font_header
                )
                subj_h = self.get_text_height(
                    lesson.subject, lane_w - 6, FONT_REG, self.font_title
                )
                room_h = self.font_base if lesson.room else 0
                teacher_h = self.font_base if lesson.teacher else 0

                required_h = header_h + subj_h + room_h + teacher_h + 15

                start_u, end_u = self.get_grid_range(lesson)
                time_units = max(0.25, end_u - start_u)

                needed_row_h = required_h / time_units
                if needed_row_h > max_row_height:
                    max_row_height = needed_row_h

        self.row_height = max_row_height
        total_height = (
            self.top_margin + (self.num_rows * self.row_height) + self.bottom_margin
        )

        self.height = max(landscape(A4)[1], total_height)

        self.c.setPageSize((self.width, self.height))

        self.c.setFont(FONT_BOLD, 14)
        self.c.drawCentredString(self.width / 2, self.height - 30, schedule.title)

        self.draw_grid()
        self.draw_lessons(schedule)

        self.c.save()
        self.buffer.seek(0)
        return self.buffer
