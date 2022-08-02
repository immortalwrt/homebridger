/* SPDX-License-Identifier: GPL-3.0-only
 *
 * Copyright (C) 2022 ImmortalWrt.org
 */

'use strict';
'require form';
'require poll';
'require uci';
'require view';

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('homeproxy')
		]);
	},

	render: function(data) {
		var m, s, o;

		m = new form.Map('homeproxy', _('Edit servers'));

		s = m.section(form.NamedSection, 'server', 'homeproxy', _('Global settings'));

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;

		s = m.section(form.GridSection, 'server');
		s.addremove = true;
		s.anonymous = true;
		s.nodescriptions = true;
		s.sortable = true;
		s.modaltitle = function(section_id) {
			var alias = uci.get(data[0], section_id, 'alias');
			return alias ? _('Server') + ' » ' + alias : _('Add a server');
		}

		o = s.option(form.Value, 'alias', _('Alias'));
		o.rmempty = false;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;
		o.editable = true;

		o = s.option(form.ListValue, 'type', _('Type'));
		o.value('http', _('HTTP'));
		o.value('shadowsocks', _('Shadowsocks'));
		o.value('socks', _('Socks'));
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Port'),
			_('The port must be unique.'));
		o.datatype = 'port';
		o.rmempty = false;

		o = s.option(form.DynamicList, 'username_password', _('Username / Password (UUID)'),
			_('Format as user:pass(uuid).'));
		o.validate = function(section_id, value) {
			if (section_id) {
				if (this.formvalue(section_id).length === 0)
					return _('Expecting: non-empty value');
				else if (!value)
					return true;

				var user = value.split(':')[0], pass = value.split(':')[1];
				if (value.split(':').length > 2 || !user || !pass)
					return _('Expecting: %s').format(_('valid user:pass(uuid) pair'));

				var type = this.map.lookupOption('type', section_id)[0].formvalue(section_id);
				if (type === 'shadowsocks') {
					var encmode = this.map.lookupOption('shadowsocks_encrypt_method', section_id)[0].formvalue(section_id);
					if (encmode === '2022-blake3-aes-128-gcm' && value.length !== 16)
						return _('Expecting: %s').format(_('password with %d characters')).format(16);
					else if (['2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305'].includes(encmode) && value.length !== 32)
						return _('Expecting: %s').format(_('password with %d characters')).format(32);
				}
			}
		}
		o.modalonly = true;

		o = s.option(form.ListValue, 'shadowsocks_encrypt_method', _('Encrypt method'));
		o.value('none');
		o.value('plain');
		o.value('aes-128-gcm');
		o.value('aes-192-gcm');
		o.value('aes-256-gcm');
		o.value('chacha20-ietf-poly1305');
		o.value('xchacha20-ietf-poly1305');
		o.value('2022-blake3-aes-128-gcm');
		o.value('2022-blake3-aes-256-gcm');
		o.value('2022-blake3-chacha20-poly1305');
		o.default = 'aes-128-gcm';
		o.depends('type', 'shadowsocks');
		o.depends({'type': 'v2ray', 'v2ray_protocol': 'shadowsocks'});
		o.modalonly = true;

		o = s.option(form.Flag, 'sniff', _('Enable sniffing'),
			_('See <a target="_blank" href="https://sing-box.sagernet.org/configuration/route/sniff/">Sniff</a> for details.'));
		o.default = o.enabled;
		o.rmempty = false;
		o.modalonly = true;

		o = s.option(form.Flag, 'sniff_override', _('Override destination'),
			_('Override the connection destination address with the sniffed domain.'));
		o.default = o.enabled;
		o.rmempty = false;
		o.depends('sniff', '1');

		o = s.option(form.ListValue, 'network', _('Network'));
		o.value('tcp', _('TCP'));
		o.value('udp', _('UDP'));
		o.value('both', _('Both'));
		o.default = 'both';
		o.depends('type', 'shadowsocks');
		o.modalonly = true;

		return m.render();
	}
});