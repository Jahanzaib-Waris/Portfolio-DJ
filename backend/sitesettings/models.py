from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

hex_color_validator = RegexValidator(
    regex=r'^#[0-9a-fA-F]{6}$',
    message='Enter a hex color like #58a6ff.',
)


class SiteBranding(models.Model):
    """Singleton holding the site-wide brand identity: name, logo, favicon.

    Distinct from `profiles.Profile` (the portfolio owner's personal info used
    in the hero/nav name) — this is the site chrome: browser tab title, the
    control panel header, and (once wired up) a logo image separate from the
    owner's personal photo.
    """

    site_name = models.CharField(max_length=80, default='Portfolio')
    logo = models.ImageField(upload_to='branding/', blank=True, null=True)
    favicon = models.ImageField(upload_to='branding/', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site branding'
        verbose_name_plural = 'Site branding'

    def __str__(self):
        return self.site_name

    def clean(self):
        if not self.pk and SiteBranding.objects.exists():
            raise ValidationError('Only one Site branding instance is allowed. Edit the existing one instead.')


class SiteTheme(models.Model):
    """Singleton holding the one, fully-customizable site theme.

    Deliberately not a multi-theme system — there's one theme, and these are
    its knobs. Values mirror the CSS custom properties in index.css so the
    frontend can apply them at runtime via `document.documentElement.style
    .setProperty(...)` with no rebuild.
    """

    FONT_DISPLAY_CHOICES = [
        ('Inter', 'Inter'),
        ('Poppins', 'Poppins'),
        ('Space Grotesk', 'Space Grotesk'),
        ('Manrope', 'Manrope'),
        ('Sora', 'Sora'),
    ]
    FONT_MONO_CHOICES = [
        ('JetBrains Mono', 'JetBrains Mono'),
        ('Fira Code', 'Fira Code'),
        ('IBM Plex Mono', 'IBM Plex Mono'),
        ('Roboto Mono', 'Roboto Mono'),
    ]
    RADIUS_CHOICES = [
        ('sharp', 'Sharp'),
        ('soft', 'Soft'),
        ('rounded', 'Rounded'),
    ]
    SHADOW_CHOICES = [
        ('none', 'None'),
        ('subtle', 'Subtle'),
        ('elevated', 'Elevated'),
    ]
    BUTTON_STYLE_CHOICES = [
        ('solid', 'Solid fill'),
        ('outline', 'Outline'),
        ('soft', 'Soft tint'),
    ]
    CARD_STYLE_CHOICES = [
        ('clean', 'Clean border'),
        ('accent', 'Accent border'),
    ]

    color_void = models.CharField(max_length=7, default='#0d1117', validators=[hex_color_validator])
    color_panel = models.CharField(max_length=7, default='#161b22', validators=[hex_color_validator])
    color_panel_edge = models.CharField(max_length=7, default='#30363d', validators=[hex_color_validator])
    color_neon_blue = models.CharField(max_length=7, default='#58a6ff', validators=[hex_color_validator])
    color_neon_indigo = models.CharField(max_length=7, default='#388bfd', validators=[hex_color_validator])
    color_accent = models.CharField(max_length=7, default='#238636', validators=[hex_color_validator])
    color_status_green = models.CharField(max_length=7, default='#3fb950', validators=[hex_color_validator])
    color_status_red = models.CharField(max_length=7, default='#f85149', validators=[hex_color_validator])

    font_display = models.CharField(max_length=40, choices=FONT_DISPLAY_CHOICES, default='Inter')
    font_mono = models.CharField(max_length=40, choices=FONT_MONO_CHOICES, default='JetBrains Mono')

    radius_scale = models.CharField(max_length=10, choices=RADIUS_CHOICES, default='soft')
    shadow_intensity = models.CharField(max_length=10, choices=SHADOW_CHOICES, default='none')
    button_style = models.CharField(max_length=10, choices=BUTTON_STYLE_CHOICES, default='solid')
    card_style = models.CharField(max_length=10, choices=CARD_STYLE_CHOICES, default='clean')

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site theme'
        verbose_name_plural = 'Site theme'

    def __str__(self):
        return 'Site theme'

    def clean(self):
        if not self.pk and SiteTheme.objects.exists():
            raise ValidationError('Only one Site theme instance is allowed. Edit the existing one instead.')
