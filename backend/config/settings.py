"""
Django settings for config project.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, True),
)
environ.Env.read_env(BASE_DIR / '.env')


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-dev-key-change-me')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DEBUG', default=True)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Required in production so Django admin/CSRF-protected POSTs are trusted
# when served from behind Render's (or any) HTTPS domain.
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

# Render (and most PaaS hosts) terminate TLS at a proxy and forward requests
# over plain HTTP with this header set, so Django needs telling how to detect HTTPS.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'profiles',
    'blog',
    'projects',
    'quotes',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases
#
# Defaults to local SQLite so the project runs immediately with zero setup.
# Set SUPABASE_DB_HOST (and friends) in .env to point at Supabase Postgres instead.

if env('SUPABASE_DB_HOST', default=''):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('SUPABASE_DB_NAME', default='postgres'),
            'USER': env('SUPABASE_DB_USER', default='postgres'),
            'PASSWORD': env('SUPABASE_DB_PASSWORD', default=''),
            'HOST': env('SUPABASE_DB_HOST'),
            'PORT': env('SUPABASE_DB_PORT', default='5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (resume PDF, profile photo, project/blog images)
#
# Defaults to local disk so the project runs immediately with zero setup.
# Set SUPABASE_STORAGE_BUCKET_NAME (and friends) in .env to serve/store media
# from Supabase Storage (S3-compatible) instead — required on hosts with an
# ephemeral filesystem, since local uploads would be wiped on every redeploy.
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

if env('SUPABASE_STORAGE_BUCKET_NAME', default=''):
    AWS_ACCESS_KEY_ID = env('SUPABASE_STORAGE_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = env('SUPABASE_STORAGE_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = env('SUPABASE_STORAGE_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = env('SUPABASE_STORAGE_ENDPOINT_URL')
    AWS_S3_REGION_NAME = env('SUPABASE_STORAGE_REGION', default='us-east-1')
    # Supabase's S3 gateway only accepts SigV4 — django-storages/botocore
    # otherwise falls back to the older SigV2 style, which gets a 403.
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_DEFAULT_ACL = None
    # Supabase's S3-compatible gateway requires a signed request for every object,
    # even in a "public" bucket — unsigned URLs get a 403 "Missing signature".
    # So URLs need the SigV4 query-string signature (with an expiry) rather than
    # a bare unsigned URL like a real public S3 bucket would allow.
    AWS_QUERYSTRING_AUTH = True
    AWS_QUERYSTRING_EXPIRE = 3600
    STORAGES['default'] = {'BACKEND': 'storages.backends.s3.S3Storage'}
else:
    STORAGES['default'] = {'BACKEND': 'django.core.files.storage.FileSystemStorage'}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Django REST Framework

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}


# CORS - allow the Vite dev server (and any extra origins from env) to call the API

CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173', 'http://127.0.0.1:5173'],
)
