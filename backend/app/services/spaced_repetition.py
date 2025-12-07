from datetime import datetime, timedelta
from typing import Optional

class SpacedRepetitionScheduler:
    """Anki-like spaced repetition algorithm."""
    
    # Intervals in days for each level
    INTERVALS = {
        0: 1,      # First review after 1 day
        1: 3,      # Second review after 3 days
        2: 7,      # Third review after 7 days
        3: 14,     # Fourth review after 14 days
        4: 30,     # Fifth review after 30 days
        5: 60,     # Sixth review after 60 days
    }
    
    @staticmethod
    def calculate_next_review(
        review_count: int,
        mastery_level: int,
        last_reviewed: Optional[datetime] = None
    ) -> datetime:
        """Calculate next review date based on spaced repetition."""
        if last_reviewed is None:
            last_reviewed = datetime.utcnow()
        
        # Determine interval based on review count
        interval = SpacedRepetitionScheduler.INTERVALS.get(review_count, 365)
        
        # Adjust based on mastery level (higher mastery = longer intervals)
        adjusted_interval = int(interval * (1 + mastery_level * 0.1))
        
        next_review = last_reviewed + timedelta(days=adjusted_interval)
        return next_review
    
    @staticmethod
    def get_due_concepts(user_concepts: list) -> list:
        """Get concepts that are due for review."""
        due_concepts = []
        now = datetime.utcnow()
        
        for concept in user_concepts:
            if concept.next_review is None or concept.next_review <= now:
                due_concepts.append(concept)
        
        # Sort by due date (most overdue first)
        due_concepts.sort(key=lambda c: c.next_review or datetime.min)
        
        return due_concepts
    
    @staticmethod
    def schedule_next_review(
        review_count: int,
        mastery_level: int,
        quality: int = 3  # 0-5 scale, 3 = correct answer
    ) -> dict:
        """Schedule next review and return updated stats."""
        new_review_count = review_count + 1
        
        # Adjust mastery based on quality (0=incorrect, 5=perfect)
        quality_factor = (quality - 3) * 0.2  # -0.6 to +0.4
        new_mastery = max(0, min(5, mastery_level + quality_factor))
        
        next_review = SpacedRepetitionScheduler.calculate_next_review(
            new_review_count,
            int(new_mastery)
        )
        
        return {
            "review_count": new_review_count,
            "mastery_level": new_mastery,
            "next_review": next_review.isoformat(),
            "quality": quality
        }
