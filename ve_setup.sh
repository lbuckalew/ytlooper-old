#!/bin/bash

# **Usage:
#     source ve_setup.sh <ENV_TYPE>

# **IF the 'source' keyword is not used in the place of 'bash'
#     ENV_TYPE will not remain stored in the environment
#     after the script has exited


# checks for a given argument DEV/PROD
# to decide which requirements files and settings modules are needed
#       defaults to DEV if none is given

if [ $# == 1 ]; then
    # An argument was given, try to use it

    case "$1" in
        [Dd][Ee][Vv] )
            # Development against SQLite DB
            req_type="DEV"
            ;;
        [Tt][Ee][Ss][Tt] )
            # Testing against Postgres DB
            req_type="TEST"
            ;;
        [Pp][Rr][Oo][Dd] )
            # Production environment used in deployment
            req_type="PROD"
            ;;
        [Dd][Oo][Cc] )
            # Documentation build requirements
            req_type="DOC"
            ;;
        [Pp][Rr][Oo][Ff] )
            # Profiling requirements/settings
            req_type="PROF"
            ;;
        * )
            echo "Unrecognized Environment Type -- Using DEV"
            req_type="DEV"
            ;;
    esac

else
    # No argument was given, assume DEV
    req_type="DEV"
fi

# set a environment-variable for reference in requirements/django-settings
export ENV_TYPE="$req_type"

if [ -d .env ]; then
    echo "Virtual environment found."
else
    echo "Creating virtual environment."
    virtualenv .env
fi

source .env/bin/activate
echo "Trying Fabric install..."
pip install fabric