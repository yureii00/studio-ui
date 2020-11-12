/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import React, { useRef } from 'react';
import { useStore } from 'react-redux';
import { useMount } from '../../utils/hooks';
import { NonReactComponentRecord } from '../../utils/craftercms';

interface NonReactWidgetProps {
  widget: NonReactComponentRecord;
  configuration: any;
}

function NonReactWidget(props: NonReactWidgetProps) {
  const ref = useRef();
  const store = useStore();
  useMount(() => {
    return props.widget.main({ store, element: ref.current, configuration: props.configuration });
  });
  return <div ref={ref} />;
}

export default NonReactWidget;
