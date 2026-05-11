from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Tag(TimeStampedModel):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Showcase(TimeStampedModel):
    title = models.CharField(max_length=200)
    url = models.URLField(max_length=500)
    description = models.TextField(blank=True)
    tags = models.ManyToManyField(
        Tag,
        related_name="showcases",
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Collection(TimeStampedModel):
    name = models.CharField(max_length=150)
    brief = models.TextField(blank=True)
    showcases = models.ManyToManyField(
        Showcase,
        through="CollectionItem",
        related_name="collections",
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class CollectionItem(TimeStampedModel):
    class Status(models.TextChoices):
        SELECTED = "selected", "Selected"
        KEPT = "kept", "Kept"
        REMOVED = "removed", "Removed"
        FINAL_REFERENCE = "final_reference", "Final Reference"

    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name="items",
    )
    showcase = models.ForeignKey(
        Showcase,
        on_delete=models.CASCADE,
        related_name="collection_items",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SELECTED,
    )
    selection_reason = models.TextField(blank=True)
    review_note = models.TextField(blank=True)
    removal_reason = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["collection", "showcase"],
                name="unique_showcase_per_collection",
            )
        ]

    def __str__(self):
        return f"{self.collection.name} - {self.showcase.title}"