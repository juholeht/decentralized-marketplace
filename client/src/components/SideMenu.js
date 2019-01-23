import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import {Actions} from '../store/model'
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import {UsersUtil} from '../utils/users';
import SvgIcon from '@material-ui/core/SvgIcon';

const drawerWidth = 250;

const styles = theme => ({
  root: { 
    opacity: 0
  },
  toolbar: theme.mixins.toolbar,
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
});

function HomeIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </SvgIcon>
  );
}

function StorefronIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
    </SvgIcon>
  );
}

function UsersIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </SvgIcon>
  );
}

function WithdrawIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
    </SvgIcon>
  );
}

class SideMenu extends React.Component {
  state = {
    drawerState: false
  };

  toggleDrawer = (side, open) => () => {
    this.setState({
        drawerState: open,
    });
    this.props.drawerStateUpdated(open);
  };

  productsClicked = (side, open)  => {
    this.context.router.history.push("/products");
    this.props.pageSelected("products");
  };

  storefrontsClicked = (side, open)  => {
    this.context.router.history.push("/")
    this.props.pageSelected("storefronts");
  };

  manageStorefrontsClicked = (side, open)  => {
    this.context.router.history.push("/managestorefronts")
    this.props.pageSelected("managestorefronts");
  };

  usersClicked = (side, open)  => {
    this.context.router.history.push("/users")
    this.props.pageSelected("users");
  };

  withdrawClicked = (side, open)  => {
    this.context.router.history.push("/withdraw")
    this.props.pageSelected("withdraw");
  };

  render() {
    const { classes, userStatus } = this.props;
    const isAdmin = UsersUtil.isAdmin(userStatus);
    const isShopper = UsersUtil.isShopper(userStatus);

    const sideList = (
      <div className={classes.list}>
        <div className={classes.toolbar} />
        <Divider />
        <List>  
            <ListItem button key='Storefronts' onClick={this.storefrontsClicked}>
                <ListItemIcon><HomeIcon /></ListItemIcon>
                <ListItemText primary='Shop' />
            </ListItem>
        </List>
        <Divider />
        <List>  
            <ListItem button key='ManageStorefronts' onClick={this.manageStorefrontsClicked}>
                <ListItemIcon><StorefronIcon /></ListItemIcon>
                <ListItemText primary='Storefronts' />
            </ListItem>
        </List>
        <Divider/>
        { 
          isAdmin ? 
                <List>  
                  <ListItem button key='Users' onClick={this.usersClicked}>
                      <ListItemIcon><UsersIcon /></ListItemIcon>
                      <ListItemText primary='Users' />
                  </ListItem>
                </List> : null
        }
        {
          !isShopper ?
            <List>  
              <ListItem button key='Withdraw' onClick={this.withdrawClicked}>
                  <ListItemIcon><WithdrawIcon /></ListItemIcon>
                  <ListItemText primary='Withdraw' />
              </ListItem>
            </List> : null
        }
      </div>
    );
    return (
        <Drawer
            className={classes.drawer}
            classes={{paper: classes.drawerPaper}} 
            open={this.props.drawerState} 
            variant='persistent'>
          <div>
            {sideList}
          </div>
        </Drawer>
    );
  }
}

SideMenu.propTypes = {
  classes: PropTypes.object.isRequired,
};

SideMenu.contextTypes = {
    router: PropTypes.object
};

const mapStateToProps = (state) => {
    return {userStatus: state.userStatus, drawerState: state.drawerState}
}
  
  const mapDispatchToProps = (dispatch) => {
    return {
      drawerStateUpdated(drawerState){dispatch(Actions.drawerStateUpdated(drawerState))},
      pageSelected(page){dispatch(Actions.pageSelected(page))}
    }
  }
  
  export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
  )(withStyles(styles)(SideMenu)))
