Planka Hangout
==============

This is an encrypted group chat. It does not store ip numbers, chat logs, etc.

Running live at:

	* https://hangouts.planka.nu/


Example config file for running this server with SSL:
-----------------------------------------------------

	{
		"port": "443",

		"sslCredentials": {
			"keyFile": "cert/ssl.key",
			"caFile": "cert/ssl.ca",
			"certFile": "cert/ssl.crt"
		},

		"randomNames": [
			"toxic",
			"wicked"
		]
	}

