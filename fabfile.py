from fabric.api import *
import os

local_root = os.path.dirname(__file__)
env.hosts = ['']


def get_env_type():
    return os.environ.get('ENV_TYPE')

def is_venv():
    not_found = 'VIRTUAL_ENV' not in os.environ
    found_dir = os.environ.get('VIRTUAL_ENV')
    expected_dir = os.path.join(local_root, '.env')
    if not_found or found_dir != expected_dir:
        abort('Must run that command from the .env virtual environment.')


@task
def check_env():
    """ check that all env-requirements are met """
    is_venv()
    with lcd(local_root):

        envtype = get_env_type()
        if envtype == 'DEV':
            local('.env/bin/pip install -r pip_requirements/dev.txt')

        elif envtype == 'TEST':
            local('.env/bin/pip install -r pip_requirements/test.txt')

        elif envtype == 'PROD':
            local('.env/bin/pip install -r pip_requirements/prod.txt')

        elif envtype == 'DOC':
            local('.env/bin/pip install -r pip_requirements/doc.txt')

        elif envtype == 'PROF':
            local('.env/bin/pip install -r pip_requirements/profile.txt')

        else:
            abort('Environment type not set')

@task
def bower():
    with lcd(local_root):
        local('bower install')
        local('cp bower_components/jquery/dist/jquery.js static/js/')
        local('cp bower_components/backbone/backbone.js static/js/')
        local('cp bower_components/marionette/lib/backbone.marionette.js static/js/')
        local('cp -r bower_components/materialize/dist/font/. static/font/')
        local('cp bower_components/materialize/dist/js/materialize.js static/js/')
        local('cp -r bower_components/materialize/sass/. static/sass/')
        local('cp bower_components/underscore/underscore.js static/js/')

@task
def sass(full=False):
    with lcd(local_root):
        if full:
            local('sass static/sass/materialize.scss static/css/materialize.css')
            
        local('sass static/sass/ytlooper.scss static/css/ytlooper.css')

@task
def run():
    check_env()
    bower()
    sass()
    with lcd(local_root):
        local('python -m SimpleHTTPServer 8000')

@task
def pull():
    with lcd(local_root):
        local('git pull')


@task
def push(msg):
    with lcd(local_root):
        local('git add --all')
        pull()
        local('git commit -m "%s"' % msg)
        local('git push')