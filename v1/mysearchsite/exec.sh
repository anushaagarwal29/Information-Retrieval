pip install Django

# Terminate any processes running on the required port 8000
lsof -ti :8000 | xargs kill -9

python manage.py migrate
python manage.py runserver