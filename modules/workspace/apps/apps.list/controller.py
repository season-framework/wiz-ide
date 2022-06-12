category = wiz.server.wiz.config("wiz").get('category')
if category is None: category = wiz.server.config.wiz.category
kwargs['category'] = category