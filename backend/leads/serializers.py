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
            "next_contact_at",
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


class PublicLeadSerializer(serializers.ModelSerializer):
    privacy_consent = serializers.BooleanField(write_only=True)
    website = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
    )

    class Meta:
        model = Lead
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "message",
            "privacy_consent",
            "website",
        ]
        extra_kwargs = {
            "first_name": {"max_length": 100},
            "last_name": {"max_length": 100},
            "phone": {"max_length": 30},
            "message": {"max_length": 5000},
        }

    def validate_privacy_consent(self, value):
        if not value:
            raise serializers.ValidationError("Consent is required.")
        return value

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError("Invalid submission.")
        return value

    def validate_message(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Message is too short.")
        return value

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError(
                "Provide an email address or phone number."
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("privacy_consent")
        validated_data.pop("website", None)
        return super().create(validated_data)
