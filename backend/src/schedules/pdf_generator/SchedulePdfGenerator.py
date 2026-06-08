from datetime import time
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from src.schedules.pdf_generator.models import Lesson, Day, Schedule

try:
    pdfmetrics.registerFont(TTFont("Arial", "arial.ttf"))
    pdfmetrics.registerFont(TTFont("Arial-Bold", "arialbd.ttf"))
    FONT_REG = "Arial"
    FONT_BOLD = "Arial-Bold"
except Exception:
    FONT_REG = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"


class SchedulePdfGenerator:
    def __init__(self, filename):
        self.filename = filename
        self.c = canvas.Canvas(filename, pagesize=landscape(A4))
        self.width, self.height = landscape(A4)

        self.time_col_x = 25
        self.time_col_width = 45
        self.left_margin = self.time_col_x + self.time_col_width
        self.right_margin = 35
        self.top_margin = 80
        self.bottom_margin = 40

        self.days = list(Day)
        self.day_width = (self.width - self.left_margin - self.right_margin) / len(
            self.days
        )

        self.num_rows = 12
        self.row_height = (
            self.height - self.top_margin - self.bottom_margin
        ) / self.num_rows

    # =================================================
    # HELPERS
    # =================================================

    def time_to_grid_units(self, t: time) -> float:
        h = t.hour
        m = t.minute
        if m >= 15:
            return float(h - 8) + (m - 15) / 45.0
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

    def draw_wrapped_text(self, text, x, y_top, max_width, font, size):
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

        line_h = size + 1.5
        for i, line in enumerate(lines):
            self.c.drawString(x, y_top - size - i * line_h, line)

        return len(lines) * line_h

    def group_into_lanes(self, cluster: list[Lesson]):
        lanes = []

        for lesson in cluster:
            placed = False
            for lane in lanes:
                if not any(self.overlaps(lesson, ex) for ex in lane):
                    lane.append(lesson)
                    placed = True
                    break
            if not placed:
                lanes.append([lesson])

        return lanes

    # =================================================
    # RYSOWANIE
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
            y = self.height - self.top_margin - row * self.row_height
            c.line(self.time_col_x, y, self.width - self.right_margin, y)

        for i, day in enumerate(self.days):
            x = self.left_margin + i * self.day_width
            c.line(x, self.bottom_margin, x, self.height - self.top_margin)

            c.setFont(FONT_BOLD, 11)
            c.drawCentredString(
                x + self.day_width / 2,
                self.height - self.top_margin + 10,
                day.pl_name,
            )

    def draw_lessons(self, schedule: Schedule):
        c = self.c

        for i, day in enumerate(self.days):
            day_lessons = [l for l in schedule.lessons if l.day == day]

            clusters = []
            for l in sorted(day_lessons, key=lambda x: self.get_grid_range(x)[0]):
                if not clusters:
                    clusters.append([l])
                else:
                    cluster = clusters[-1]
                    if self.get_grid_range(l)[0] < max(
                        self.get_grid_range(x)[1] for x in cluster
                    ):
                        cluster.append(l)
                    else:
                        clusters.append([l])

            for cluster in clusters:
                lanes = self.group_into_lanes(cluster)
                lane_width = self.day_width / len(lanes)

                for lane_idx, lane in enumerate(lanes):
                    for lesson in lane:
                        x = (
                            self.left_margin
                            + i * self.day_width
                            + lane_idx * lane_width
                        )

                        s, e = self.get_grid_range(lesson)

                        y_top = self.height - self.top_margin - s * self.row_height
                        y_bottom = self.height - self.top_margin - e * self.row_height

                        rx, ry = x + 1.5, y_bottom + 1.5
                        rw, rh = lane_width - 3, y_top - y_bottom - 3

                        c.setFillColor(colors.white)
                        c.setStrokeColor(self.get_color_for_type(lesson.type_label))
                        c.rect(rx, ry, rw, rh, fill=1, stroke=1)

                        c.setFillColor(colors.black)

                        self.draw_wrapped_text(
                            f"{lesson.type_label}, {lesson.weeks}",
                            rx + 2,
                            y_top - 2,
                            rw - 4,
                            FONT_BOLD,
                            6,
                        )

                        self.draw_wrapped_text(
                            lesson.subject,
                            rx + 2,
                            y_top - 18,
                            rw - 4,
                            FONT_REG,
                            6,
                        )

    # =================================================
    # BUILD
    # =================================================

    def build(self, schedule: Schedule):
        self.c.setFont(FONT_BOLD, 14)
        self.c.drawCentredString(self.width / 2, self.height - 30, schedule.title)

        self.draw_grid()
        self.draw_lessons(schedule)

        self.c.save()
        print("PDF wygenerowany:", self.filename)
