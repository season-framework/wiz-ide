try: category = wiz.server.wiz.config("wiz").get('category')
except: category = wiz.server.config.wiz.category
kwargs['category'] = category