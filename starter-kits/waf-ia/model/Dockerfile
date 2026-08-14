FROM python:3.12-alpine
WORKDIR /app
COPY model/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY model/server.py /app/server.py
COPY student /app/student
EXPOSE 8000
CMD ["python", "server.py"]
