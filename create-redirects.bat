@echo off
echo Creating redirects for old admin pages...

echo Creating redirect for chef-de-departement.html
echo ^<!DOCTYPE html^> > chef-de-departement.html
echo ^<html lang="fr"^> >> chef-de-departement.html
echo ^<head^> >> chef-de-departement.html
echo     ^<meta charset="UTF-8"^> >> chef-de-departement.html
echo     ^<meta http-equiv="refresh" content="0;url=admin-dashboard.html"^> >> chef-de-departement.html
echo     ^<title^>Redirection...^</title^> >> chef-de-departement.html
echo ^</head^> >> chef-de-departement.html
echo ^<body^> >> chef-de-departement.html
echo     ^<p^>Redirection vers la nouvelle interface d'administration...^</p^> >> chef-de-departement.html
echo     ^<script^>window.location.href = "admin-dashboard.html";^</script^> >> chef-de-departement.html
echo ^</body^> >> chef-de-departement.html
echo ^</html^> >> chef-de-departement.html

echo Creating redirect for chef-de-specialite.html
echo ^<!DOCTYPE html^> > chef-de-specialite.html
echo ^<html lang="fr"^> >> chef-de-specialite.html
echo ^<head^> >> chef-de-specialite.html
echo     ^<meta charset="UTF-8"^> >> chef-de-specialite.html
echo     ^<meta http-equiv="refresh" content="0;url=admin-dashboard.html"^> >> chef-de-specialite.html
echo     ^<title^>Redirection...^</title^> >> chef-de-specialite.html
echo ^</head^> >> chef-de-specialite.html
echo ^<body^> >> chef-de-specialite.html
echo     ^<p^>Redirection vers la nouvelle interface d'administration...^</p^> >> chef-de-specialite.html
echo     ^<script^>window.location.href = "admin-dashboard.html";^</script^> >> chef-de-specialite.html
echo ^</body^> >> chef-de-specialite.html
echo ^</html^> >> chef-de-specialite.html

echo Creating redirect for secretaire-agent.html
echo ^<!DOCTYPE html^> > secretaire-agent.html
echo ^<html lang="fr"^> >> secretaire-agent.html
echo ^<head^> >> secretaire-agent.html
echo     ^<meta charset="UTF-8"^> >> secretaire-agent.html
echo     ^<meta http-equiv="refresh" content="0;url=admin-dashboard.html"^> >> secretaire-agent.html
echo     ^<title^>Redirection...^</title^> >> secretaire-agent.html
echo ^</head^> >> secretaire-agent.html
echo ^<body^> >> secretaire-agent.html
echo     ^<p^>Redirection vers la nouvelle interface d'administration...^</p^> >> secretaire-agent.html
echo     ^<script^>window.location.href = "admin-dashboard.html";^</script^> >> secretaire-agent.html
echo ^</body^> >> secretaire-agent.html
echo ^</html^> >> secretaire-agent.html

echo Creating redirect for vice-doyen.html
echo ^<!DOCTYPE html^> > vice-doyen.html
echo ^<html lang="fr"^> >> vice-doyen.html
echo ^<head^> >> vice-doyen.html
echo     ^<meta charset="UTF-8"^> >> vice-doyen.html
echo     ^<meta http-equiv="refresh" content="0;url=admin-dashboard.html"^> >> vice-doyen.html
echo     ^<title^>Redirection...^</title^> >> vice-doyen.html
echo ^</head^> >> vice-doyen.html
echo ^<body^> >> vice-doyen.html
echo     ^<p^>Redirection vers la nouvelle interface d'administration...^</p^> >> vice-doyen.html
echo     ^<script^>window.location.href = "admin-dashboard.html";^</script^> >> vice-doyen.html
echo ^</body^> >> vice-doyen.html
echo ^</html^> >> vice-doyen.html

echo Creating redirect for doyen.html
echo ^<!DOCTYPE html^> > doyen.html
echo ^<html lang="fr"^> >> doyen.html
echo ^<head^> >> doyen.html
echo     ^<meta charset="UTF-8"^> >> doyen.html
echo     ^<meta http-equiv="refresh" content="0;url=admin-dashboard.html"^> >> doyen.html
echo     ^<title^>Redirection...^</title^> >> doyen.html
echo ^</head^> >> doyen.html
echo ^<body^> >> doyen.html
echo     ^<p^>Redirection vers la nouvelle interface d'administration...^</p^> >> doyen.html
echo     ^<script^>window.location.href = "admin-dashboard.html";^</script^> >> doyen.html
echo ^</body^> >> doyen.html
echo ^</html^> >> doyen.html

echo Redirects created successfully!
