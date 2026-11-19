#!/usr/bin/env python3
"""Stamp ?v=<content-hash> onto CSS/JS/icon URLs so browsers fetch fresh files after every change.
Run before committing:  python3 scripts/version-assets.py"""
import hashlib, glob, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
ASSETS = {
    '/assets/css/styles.css': 'assets/css/styles.css',
    '/assets/js/main.js': 'assets/js/main.js',
    '/assets/js/motion.js': 'assets/js/motion.js',
    '/assets/img/og-image.jpg': 'assets/img/og-image.jpg',
    '/assets/img/apple-touch-icon.png': 'assets/img/apple-touch-icon.png',
    '/assets/img/icon-192.png': 'assets/img/icon-192.png',
    '/assets/img/icon-512.png': 'assets/img/icon-512.png',
    '/favicon.ico': 'favicon.ico',
}
digest = lambda p: hashlib.sha1(open(p, 'rb').read()).hexdigest()[:8]
for f in glob.glob('*.html') + ['site.webmanifest']:
    s = open(f).read()
    for url, path in ASSETS.items():
        s = re.sub(re.escape(url) + r'(\?v=[0-9a-f]+)?(?=["\s])', f'{url}?v={digest(path)}', s)
    open(f, 'w').write(s)
print('assets versioned')
