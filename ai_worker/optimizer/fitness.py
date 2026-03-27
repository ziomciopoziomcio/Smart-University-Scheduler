from typing import List
from .models import ClassSessionGene, ScheduleChromosome

class FitnessCalculator:
    def __init__(self):
        """Fitness calculator class init"""
        self.W_DAY_USED = 100
        self.W_GAP_SLOT = 50
        self.W_MAX_GAP = 200 # gap longer than 2 slots
        self.W_ROOM_SIZE = 1 # per one free seat
        self.W_CAMPUS_CHANGE = 500 # without gap
        self.W_FATIGUE = 150 # day longer than 6 hours
