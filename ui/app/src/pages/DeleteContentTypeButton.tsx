/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import DeleteRounded from '@material-ui/icons/DeleteRounded';
import DeleteContentTypeDialog from '../components/DeleteContentTypeDialog';
import ContentType from '../models/ContentType';

function DeleteContentTypeButton() {
  const [open, setOpen] = useState(true);
  const [contentTypeId, setContentTypeId] = useState('/component/responsive_columns');
  return (
    <>
      <input type="text" value={contentTypeId} onChange={(e) => setContentTypeId(e.target.value)} />
      <IconButton onClick={() => setOpen(true)}>
        <DeleteRounded />
      </IconButton>
      <DeleteContentTypeDialog
        open={open}
        onClose={() => setOpen(false)}
        contentType={{ id: contentTypeId, name: 'My Content Type' } as ContentType}
      />
    </>
  );
}

export default DeleteContentTypeButton;
