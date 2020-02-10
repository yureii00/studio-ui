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

import { useSelection } from '../../utils/hooks';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import DialogContent from '@material-ui/core/DialogContent';
import TextField from '@material-ui/core/TextField';
import PasswordTextField from '../Controls/PasswordTextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React, { CSSProperties, PropsWithChildren, useEffect, useState } from 'react';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { useDispatch } from 'react-redux';
import { login, validateSession } from '../../state/actions/auth';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import loginGraphicUrl from '../../assets/authenticate.svg';
import { interval } from 'rxjs';
import { getLogoutInfoURL } from '../../services/auth';
import { pluck } from 'rxjs/operators';
import { isBlank } from '../../utils/string';
import Typography from '@material-ui/core/Typography';
import OpenInNewRounded from '@material-ui/icons/OpenInNewRounded';

const translations = defineMessages({
  sessionExpired: {
    id: 'authMonitor.sessionExpiredMessage',
    defaultMessage: 'Your session has expired. Please log back in.'
  },
  incorrectPasswordMessage: {
    id: 'authMonitor.incorrectPasswordMessage',
    defaultMessage: 'Incorrect password. Please try again.'
  }
});

const useStyles = makeStyles((theme) => createStyles({
  input: {
    marginBottom: theme.spacing(2)
  },
  actions: {
    placeContent: 'center space-between'
  },
  dialog: {
    width: 400
  },
  graphic: {
    width: 150
  },
  title: {
    textAlign: 'center'
  },
  ssoAction: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column'
  }
}));

export default function AuthMonitor() {

  const classes = useStyles({});
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const { username, authType } = useSelection(state => state.user);
  const authoringUrl = useSelection<string>(state => state.env.AUTHORING_BASE);
  const { active, error, isFetching } = useSelection(state => state.auth);
  const [password, setPassword] = useState<string>('');
  const [logoutUrl, setLogoutUrl] = useState(authoringUrl);
  const isSSO = (authType.toLowerCase() !== 'db');
  const [ssoButtonClicked, setSSOButtonClicked] = useState(false);
  const styles: CSSProperties = isFetching ? { visibility: 'hidden' } : {};

  const onSubmit = () => {
    if (isSSO) {
      dispatch(validateSession());
      setSSOButtonClicked(false);
    } else {
      !isBlank(password) && dispatch(login({ username, password }))
    }
  };

  const onClose = () => {
    window.location.href = logoutUrl ?? authoringUrl;
  };

  useEffect(() => {
    if (isSSO) {
      getLogoutInfoURL().pipe(pluck('logoutUrl')).subscribe(setLogoutUrl);
    }
  }, [isSSO]);

  useEffect(() => {
    if (active) {
      setPassword('');
      const sub = interval(300000).subscribe(() => dispatch(validateSession()));
      return () => sub.unsubscribe();
    }
  }, [active, dispatch]);

  return (
    <Dialog
      open={!active}
      aria-labelledby="craftercmsReLoginDialog"
    >
      <DialogTitle id="craftercmsReLoginDialog" className={classes.title} style={styles}>
        <FormattedMessage
          id="authMonitor.dialogTitleText"
          defaultMessage="Session Expired"
        />
      </DialogTitle>
      <DialogContent className={classes.dialog}>
        {
          isFetching ? (
            <LoadingState
              title=""
              classes={{ graphic: classes.graphic }}
            />
          ) : (
            <>
              {
                error ? (
                  <ErrorState error={error} classes={{ graphic: classes.graphic }}/>
                ) : (
                  <ErrorState
                    graphicUrl={loginGraphicUrl}
                    classes={{ graphic: classes.graphic }}
                    error={{ message: formatMessage(translations.sessionExpired) }}
                  />
                )
              }
              {
                isSSO ? (
                  <SSOForm
                    authoringUrl={authoringUrl}
                    username={username}
                    onSubmit={onSubmit}
                    ssoButtonClicked={ssoButtonClicked}
                    onSetSSOButtonClicked={setSSOButtonClicked}
                  />
                ) :(
                  <LogInForm
                    username={username}
                    isFetching={isFetching}
                    onSubmit={onSubmit}
                    password={password}
                    onSetPassword={setPassword}
                  />
                )
              }
            </>
          )
        }
      </DialogContent>
      <DialogActions className={classes.actions} style={styles}>
        <Button type="button" onClick={onClose} disabled={isFetching}>
          <FormattedMessage id="authMonitor.logOutButtonLabel" defaultMessage="Log Out"/>
        </Button>
        <Button type="button" onClick={onSubmit} color="primary" disabled={isFetching} variant={ssoButtonClicked ? 'contained' : 'text'}>
          {
            isSSO
              ? <FormattedMessage id="authMonitor.validateSessionButtonLabel" defaultMessage="Resume"/>
              : <FormattedMessage id="authMonitor.loginButtonLabel" defaultMessage="Log In"/>
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type SSOFormProps = PropsWithChildren<{
  username: string;
  authoringUrl: string;
  onSubmit: (e) => any;
  ssoButtonClicked: boolean;
  onSetSSOButtonClicked: Function;
}>;

function SSOForm(props: SSOFormProps) {
  const { username, onSubmit, authoringUrl, ssoButtonClicked, onSetSSOButtonClicked } = props;
  const classes = useStyles({});
  const onOpenLogin = () => {
    window.open(
      `${authoringUrl}/login/resume`,
      '_blank',
      'toolbar=0,location=0,menubar=0,dependent=true'
    );
    onSetSSOButtonClicked(true);
  };
  return (
    <form onSubmit={onSubmit}>
      <TextField
        fullWidth
        disabled
        type="email"
        value={username}
        className={classes.input}
        label={
          <FormattedMessage id="authMonitor.usernameTextFieldLabel" defaultMessage="Username"/>
        }
      />
      <section className={classes.ssoAction}>
        <Button
          type="button"
          color="primary"
          variant={ssoButtonClicked ? 'outlined' : 'contained'}
          onClick={onOpenLogin}
          endIcon={<OpenInNewRounded/>}
        >
          <FormattedMessage id="authMonitor.openSSOLoginButtonLabel" defaultMessage="Open Login Form"/>
        </Button>
        <Typography variant="caption">
          <FormattedMessage
            id="authMonitor.ssoOpenPopupMessage"
            defaultMessage={
              "Make sure pop ups are not blocked. Once you log in, come back to " +
              "this window and click on `Resume` button below."
            }
          />
        </Typography>
      </section>
    </form>
  );
}

type LogInFormProps = PropsWithChildren<{
  username: string;
  password: string;
  isFetching: boolean;
  onSubmit: (e) => any;
  onSetPassword: Function;
}>;

function LogInForm(props: LogInFormProps) {
  const { username, onSubmit, isFetching, onSetPassword, password } = props;
  const classes = useStyles({});
  return (
    <form onSubmit={onSubmit}>
      <TextField
        fullWidth
        disabled
        type="email"
        value={username}
        className={classes.input}
        label={
          <FormattedMessage id="authMonitor.usernameTextFieldLabel" defaultMessage="Username"/>
        }
      />
      <PasswordTextField
        fullWidth
        autoFocus
        value={password}
        onChange={(e) => onSetPassword(e.target.value)}
        label={
          <FormattedMessage id="authMonitor.passwordTextFieldLabel" defaultMessage="Password"/>
        }
      />
      {/* This button is just to have the form submit when pressing enter. */}
      <Button
        children=""
        type="submit"
        onClick={onSubmit}
        disabled={isFetching}
        style={{ display: 'none' }}
      />
    </form>
  );
}
