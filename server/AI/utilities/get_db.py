import psycopg2
from fastapi import Depends


def get_db ():

    conn = psycopg2.connect(
    dbname = "webFinalProject" , 
    user = "postgres" , 
    password = "root" , 
    host = "localhost" , 
    port = 5432
    )
    cursor = conn.cursor()
    try:
        yield(cursor , conn)
    finally:
        cursor.close()
        conn.close()