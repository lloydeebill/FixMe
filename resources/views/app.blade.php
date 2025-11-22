<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title inertia>{{ config('app.name', 'Fix Me') }}</title>

  <!-- Tailwind CSS is typically loaded here, usually configured via Vite -->

  <!-- The `@vite` directive loads your bundled JavaScript (resources/js/app.jsx) -->
  @vite('resources/js/app.jsx')

  <!-- The `@inertiaHead` directive handles meta tags and page titles -->
  @inertiaHead
</head>

<body class="bg-gray-100">
  <!-- The `@inertia` directive is the mount point for the entire React application -->
  @inertia
</body>

</html>