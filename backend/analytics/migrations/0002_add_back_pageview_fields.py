from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='pageview',
            name='is_blog_post',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='pageview',
            name='slug',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
