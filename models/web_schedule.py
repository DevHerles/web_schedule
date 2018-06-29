# -*- coding: utf-8 -*-

from odoo import models, fields


class View(models.Model):
    _name = 'ir.ui.view'
    _inherit = 'ir.ui.view'

    type = fields.Selection(selection_add=[('schedule', 'Schedule')])
