/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState } from 'react';
import { Core, FileInput, XHRUpload, ProgressBar, Form } from 'uppy';
import { FormattedMessage } from 'react-intl';
import { defineMessages, useIntl } from "react-intl";

import 'uppy/src/style.scss';

const messages = defineMessages({
  chooseFile: {
    id: 'fileUpload.chooseFile',
    defaultMessage: 'Choose File'
  },
  uploadingFile: {
    id: 'fileUpload.uploadingFile',
    defaultMessage: 'Uploading File'
  },
  uploadedFile: {
    id: 'fileUpload.uploadedFile',
    defaultMessage: 'Uploaded File'
  }
});

interface UppyProps {
  formTarget: string;
  url: string;
  onUploadStart?(): void;
  onComplete?(result: any): void;
  fileTypes?: [string];
}

function SingleFileUpload(props: UppyProps) {

  const
    {
      url,
      formTarget,
      onUploadStart,
      onComplete,
      fileTypes
    } = props;
  
  const uppyConfig: object = {
    autoProceed: true,
    ...(
      (fileTypes) 
        ? { restrictions: { allowedFileTypes: fileTypes } } 
        : {}
    )
  };

  const uppy = Core(uppyConfig);
  const { formatMessage } = useIntl();
  const [description, setDescription] = useState(
    <FormattedMessage
      id="fileUpload.selectFileMessage"
      defaultMessage={`Please select a file to upload`}
    />
  );
  const [fileName, setFileName] = useState();
  
  let uploadBtn: HTMLInputElement;

  useEffect(
    () => {
      const instance = uppy
        .use(FileInput, {
          target: '.uppy-file-input-container',
          replaceTargetContent: false,
          locale: {
            strings: {
              chooseFiles: formatMessage(messages.chooseFile),
            }
          }
        })
        .use(Form, {
          target: formTarget,
          getMetaFromForm: true,
          addResultToForm: true,
          submitOnSuccess: false,
          triggerUploadOnSubmit: false
        })
        .use(ProgressBar, {
          target: '.uppy-progress-bar',
          hideAfterFinish: false
        })
        .use(XHRUpload, {
          endpoint: url,
          formData: true,
          fieldName: 'file'
        })
        uppy.on('file-added', (file) => {
          uploadBtn = document.querySelector('.uppy-FileInput-btn');
          setDescription(`${formatMessage(messages.uploadingFile)}:`);
          setFileName(file.name);
          uploadBtn.disabled = true;
          onUploadStart();
        })
        uppy.on('upload-success', (file) => {
          setDescription(`${formatMessage(messages.uploadedFile)}:`);
          uploadBtn.disabled = false;
        })
        uppy.on('complete', onComplete);
      
      return () => {
        instance.destroy();
      }
      
    },
    [formTarget, onComplete, uppy, url]
  );

  return (
    <>
      <div className="uppy-progress-bar"/>
      <div className="uploaded-files">
        <h5 className="single-file-upload--description">
          {description}
        </h5>
        <div className="uppy-file-input-container"></div>
        {
          fileName && 
          <em className="single-file-upload--file-name">{fileName}</em>
        }
      </div>
    </>
  );
}

export default SingleFileUpload;
