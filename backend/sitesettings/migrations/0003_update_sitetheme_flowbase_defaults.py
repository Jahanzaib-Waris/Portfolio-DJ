import django.core.validators
from django.db import migrations, models


def migrate_legacy_theme_values(apps, schema_editor):
    SiteTheme = apps.get_model('sitesettings', 'SiteTheme')
    for theme in SiteTheme.objects.all():
        if theme.color_accent == '#238636':
            theme.color_void = '#0A0C16'
            theme.color_panel = '#11142A'
            theme.color_panel_edge = '#232848'
            theme.color_neon_blue = '#38BDF8'
            theme.color_neon_indigo = '#7C6CFF'
            theme.color_accent = '#6D5AF6'
            theme.color_status_red = '#FCA5A5'
            theme.font_display = 'Manrope'
            theme.font_mono = 'Fira Code'
            theme.save()


class Migration(migrations.Migration):

    dependencies = [
        ('sitesettings', '0002_sitetheme'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sitetheme',
            name='color_void',
            field=models.CharField(default='#0A0C16', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a hex color like #58a6ff.', regex='^#[0-9a-fA-F]{6}$')]),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='color_panel',
            field=models.CharField(default='#11142A', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a hex color like #58a6ff.', regex='^#[0-9a-fA-F]{6}$')]),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='color_panel_edge',
            field=models.CharField(default='#232848', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a hex color like #58a6ff.', regex='^#[0-9a-fA-F]{6}$')]),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='color_neon_blue',
            field=models.CharField(default='#38BDF8', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a hex color like #58a6ff.', regex='^#[0-9a-fA-F]{6}$')]),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='color_neon_indigo',
            field=models.CharField(default='#7C6CFF', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a hex color like #58a6ff.', regex='^#[0-9a-fA-F]{6}$')]),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='color_accent',
            field=models.CharField(default='#6D5AF6', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a hex color like #58a6ff.', regex='^#[0-9a-fA-F]{6}$')]),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='color_status_red',
            field=models.CharField(default='#FCA5A5', max_length=7, validators=[django.core.validators.RegexValidator(message='Enter a hex color like #58a6ff.', regex='^#[0-9a-fA-F]{6}$')]),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='font_display',
            field=models.CharField(choices=[('Inter', 'Inter'), ('Poppins', 'Poppins'), ('Space Grotesk', 'Space Grotesk'), ('Manrope', 'Manrope'), ('Sora', 'Sora')], default='Manrope', max_length=40),
        ),
        migrations.AlterField(
            model_name='sitetheme',
            name='font_mono',
            field=models.CharField(choices=[('JetBrains Mono', 'JetBrains Mono'), ('Fira Code', 'Fira Code'), ('IBM Plex Mono', 'IBM Plex Mono'), ('Roboto Mono', 'Roboto Mono')], default='Fira Code', max_length=40),
        ),
        migrations.RunPython(migrate_legacy_theme_values, reverse_code=migrations.RunPython.noop),
    ]
