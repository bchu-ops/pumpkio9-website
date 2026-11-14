#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
s3.py
=================
Tests to verify AWS S3 cloud service interactions for the SpeedDemon ML project.
Utilizes boto3 for AWS S3 operations and moto for mocking AWS services during testing.


Usage:
    

"""
# pyright: ignore[reportMissingImports]
import boto3 
from moto import mock_aws
import pytest
import numpy as np
import pandas as pd

print("hi")