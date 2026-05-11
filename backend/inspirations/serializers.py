from rest_framework import serializers
from .models import Tag, Showcase, Collection, CollectionItem


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class ShowcaseListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Showcase
        fields = [
            "id",
            "title",
            "url",
            "description",
            "tags",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ShowcaseWriteSerializer(serializers.ModelSerializer):
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        source="tags",
        required=False,
    )

    class Meta:
        model = Showcase
        fields = [
            "id",
            "title",
            "url",
            "description",
            "tag_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CollectionItemSerializer(serializers.ModelSerializer):
    showcase = ShowcaseListSerializer(read_only=True)
    showcase_id = serializers.PrimaryKeyRelatedField(
        queryset=Showcase.objects.all(),
        source="showcase",
        write_only=True,
    )
    collection_id = serializers.PrimaryKeyRelatedField(
        queryset=Collection.objects.all(),
        source="collection",
        write_only=True,
        required=False,
    )

    class Meta:
        model = CollectionItem
        fields = [
            "id",
            "collection_id",
            "showcase",
            "showcase_id",
            "status",
            "selection_reason",
            "review_note",
            "removal_reason",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", None))
        removal_reason = attrs.get(
            "removal_reason",
            getattr(self.instance, "removal_reason", "")
        )

        if status == CollectionItem.Status.REMOVED and not removal_reason:
            raise serializers.ValidationError(
                {"removal_reason": "This field is required when status is removed."}
            )

        return attrs


class CollectionListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            "id",
            "name",
            "brief",
            "items_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "items_count", "created_at", "updated_at"]

    def get_items_count(self, obj):
        return obj.items.count()


class CollectionDetailSerializer(serializers.ModelSerializer):
    items = CollectionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = [
            "id",
            "name",
            "brief",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CollectionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ["id", "name", "brief", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]