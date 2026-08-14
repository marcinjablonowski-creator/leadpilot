from rest_framework import serializers

from .models import Lead


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "message",
            "status",
            "ai_summary",
            "ai_priority",
            "ai_reply",
            "sales_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "ai_summary",
            "ai_priority",
            "ai_reply",
            "created_at",
            "updated_at",
        ]

    def validate_message(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Message is too short.")
        return value