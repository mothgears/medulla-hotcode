(()=>{
	//SERVER
	//------------------------------------------------------------------------------------------------------------------
	if (typeof global === 'object' && global) {
		let restart = null;
		let error   = null;

		const sendError = err=>{
			if (err) {
				error = err;
				let cids = Object.keys(medulla.wsClients);
				for (let cid of cids) medulla.wsClients[cid].send('MEDSIG_ERROR|'+error.title+'|'+error.value);
			}
		};

		module.exports.medullaPlugin = {
			useOnClient: true,

			onModify (fid, fp, restartServer) {
				let mtype = '';
				let reload = fp.params.reload || 'lazy';

				if (reload === 'hot' && (fp.params.type === 'cached' || fp.params.type === 'file'))
					mtype = fp.mimeType;

				let updtype = (restartServer && (restart = restartServer)) || reload === 'lazy';
				if      (updtype)            updtype = 'lazyUpdate';
				else if (reload === 'force') updtype = 'forcedUpdate';
				else                         updtype = 'noUpdate';

				let cids = Object.keys(medulla.wsClients);
				for (let id of cids)
					medulla.wsClients[id].send('MEDSIG_MODIFY|'+updtype+'|'+mtype+'|'+(fp.url?fp.url:fid));
			},

			onError: sendError,
			onLaunch: ()=>error=null
		};

		medulla.ws.on('connection', ws=>{

			ws.on('message', msg=>{
				if (msg === 'MEDSIG_RESTART') {
					if (restart) restart(()=>{
						let cids = Object.keys(medulla.wsClients);
						for (let id of cids) medulla.wsClients[id].send('MEDSIG_REFRESH');
					});
					else {
						let cids = Object.keys(medulla.wsClients);
						for (let id of cids) medulla.wsClients[id].send('MEDSIG_REFRESH');
					}
				} else if (msg === 'MEDSIG_PAGELOADED') {
					if (error) sendError(error);
				}
			});

		});
	}

	//CLIENT
	//------------------------------------------------------------------------------------------------------------------
	else if (typeof window === 'object' && window) {
		let serverChanged   = false,
			serverCorrupted = false,
			autoReloadT     = null;

		const
			AUTORELOAD = window.medulla.settings.autoreload || 0,
			HTMLMAP = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
				'/': '&#x2F;',
				'`': '&#x60;',
				'=': '&#x3D;'
			},
			errbox = document.createElement('div');

		//FUNCTIONS
		const escapeHtml = str=>str.replace(/[&<>"'`=\/]/g, s=>HTMLMAP[s]);
		const sendMessage = (msg, wait = 50)=>{
			if (window.medulla.ws.readyState === 1) {
				window.medulla.ws.send(msg);
			} else if (wait >= 0) {
				console.log('wait connection...');
				wait--;
				setTimeout(sendMessage, 100, msg, wait);
			}
		};
		const restartServer = ()=>{
			sendMessage('MEDSIG_RESTART');
			serverChanged = false;
		};

		errbox.style.width = '100%';
		errbox.style.height = '100%';
		errbox.style.background = '#fff';
		errbox.style.color = '#c33';
		errbox.style.position = 'fixed';
		errbox.style.left = '0';
		errbox.style.top  = '0';
		errbox.style.paddingLeft = '10px';
		errbox.style.zIndex = '1000';
		errbox.style.display = 'none';
		errbox.style.paddingTop = '7px';
		errbox.style.fontFamily = 'sans-serif';
		errbox.style.fontWeight = 'bold';
		errbox.style.textAlign = 'left';
		window.addEventListener('load', ()=>{
			document.body.appendChild(errbox);
			sendMessage('MEDSIG_PAGELOADED');
		});

		window.medulla.ws.addEventListener('message', event=>{
			let msg = event.data;

			console.log(msg);
			if (msg.startsWith('MEDSIG_MODIFY')) {
				msg = msg.split('|');

				if (msg[1] === 'lazyUpdate') {
					serverChanged = true;
					if (AUTORELOAD) {
						if (autoReloadT) clearTimeout(autoReloadT);
						autoReloadT = setTimeout(restartServer, AUTORELOAD);
					}
				}
				else if (msg[1] === 'forcedUpdate') {
					if (serverChanged) restartServer();
					else if (!serverCorrupted) location.reload();
				}

				if (msg[2] === 'application/javascript') {
					console.log(msg[3]);
					let el = document.querySelector(`script[src='${msg[3]}']`);
					let newel = document.createElement('script');
					newel.src = msg[3];
					el.replaceWith(newel);
				} else if (msg[2] === 'text/css') {
					let el = document.querySelector(`link[href='${msg[3]}']`);
					let newel = document.createElement('link');
					newel.rel="stylesheet";
					newel.href = msg[3];
					el.replaceWith(newel);
				}
			} else if (msg === 'MEDSIG_REFRESH') {
				location.reload();
			} else if (msg.startsWith('MEDSIG_ERROR|')) {
				msg = msg.split('MEDSIG_ERROR|')[1];
				console.error(msg);
				errbox.style.display = 'block';
				msg = msg.split('|');
				errbox.innerHTML = msg[0]+'<br><br>'+escapeHtml(msg[1]).replace(/at/g,'<br>@ at');
				serverCorrupted = true;
			}
		});

		window.addEventListener('mousemove', ()=>{
			if (serverChanged) restartServer();
		});
	}
})();