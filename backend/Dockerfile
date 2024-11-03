# install pg_hint_plan from rpm
FROM docker.io/postgres:16

# install wget
RUN apt-get update && apt-get install -y wget
# load the required insallation file
RUN wget https://github.com/ossc-db/pg_hint_plan/releases/download/REL16_1_6_0/pg_hint_plan16-1.6.0-1.el8.x86_64.rpm
# install some alien utility for install .rpm file
RUN apt-get install -y alien
RUN alien -i pg_hint_plan16-1.6.0-1.el8.x86_64.rpm

# copy all installation .sql scripts into the /extension folder
# IDK which one postgres uses, but when I tried copying only pg_hint_plan--1.5.1--1.6.0.sql, it didnt't work
#   it threw error something like 'no installation script for 16 version'
RUN cp -a /usr/pgsql-16/share/extension/. /usr/share/postgresql/16/extension/.
RUN cp /usr/pgsql-16/lib/pg_hint_plan.so /usr/lib/postgresql/16/lib/pg_hint_plan.so

CMD ["postgres","-c","shared_preload_libraries=pg_hint_plan,pg_stat_statements"]
