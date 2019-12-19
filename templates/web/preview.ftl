<!--
  ~ Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
  ~
  ~ This program is free software: you can redistribute it and/or modify
  ~ it under the terms of the GNU General Public License as published by
  ~ the Free Software Foundation, either version 3 of the License, or
  ~ (at your option) any later version.
  ~
  ~ This program is distributed in the hope that it will be useful,
  ~ but WITHOUT ANY WARRANTY; without even the implied warranty of
  ~ MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  ~ GNU General Public License for more details.
  ~
  ~ You should have received a copy of the GNU General Public License
  ~ along with this program.  If not, see <http://www.gnu.org/licenses/>.
  -->

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="shortcut icon" href="/studio/static-assets/img/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <title>${contentModel['internal-name']} - ${contentModel['common-title']!''}</title>
  <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,400,400i,600,600i,700,700i&display=swap" rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="/studio/static-assets/themes/cstudioTheme/css/font-awesome.min.css" />
  <style>
    html, body, #root {
      margin: 0;
      padding: 0;
      height: 100%;
    }
  </style>
</head>
<body>
<div id="root"></div>
<#include "/templates/web/common/js-next-scripts.ftl" />
<script>
  CrafterCMSNext.render('#root', 'Preview');
</script>
</body>
</html>
