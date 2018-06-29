# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Web Schedule',
    'category': 'Hidden',
    'description':"""
Odoo Web Schedule view.
==========================

""",
    'author': 'ARANDASF, Herles Incalla (www.arandasf.com)',
    'version': '2.0',
    'depends': ['web'],
    'data' : [
        'views/web_schedule_templates.xml',
    ],
    'qweb': [
        'static/src/xml/*.xml',
    ],
    'auto_install': True
}
