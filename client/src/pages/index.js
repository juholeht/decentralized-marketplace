import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import withRoot from '../withRoot';
import MenuAppBar from '../components/MenuAppBar';
import SideMenu from '../components/SideMenu';
import Products from '../components/Products';
import Storefronts from '../components/Storefronts';
import ManageStorefronts from '../components/ManageStorefronts';
import ManageProducts from '../components/ManageProducts';
import Users from '../components/Users';
import Withdraw from '../components/Withdraw';
import {connect} from 'react-redux';
import {
  Route,
  Switch,
  withRouter
} from 'react-router-dom';

const drawerWidth = 250;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    marginRight: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: drawerWidth,
  },
});

class Index extends React.Component {
  state = {
    open: false,
  };

  handleClose = () => {
    this.setState({
      open: false,
    });
  };

  handleClick = () => {
    this.setState({
      open: true,
    });
  };

  render() {
    const { classes, drawerState } = this.props;

    return (
      <div className={classes.root}>
        <CssBaseline />
        <MenuAppBar/>
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: drawerState,
          })}
        >
        <div className={classes.drawerHeader} />
          <Switch>
            <Route exact path="/"  component={Storefronts} />
            <Route path="/products" component={Products} />
            <Route path="/managestorefronts"  component={ManageStorefronts} />
            <Route path="/manageproducts"  component={ManageProducts} />
            <Route path="/users" component={Users} />
            <Route path="/withdraw" component={Withdraw} />
          </Switch>
          </main>
          <SideMenu/>
      </div>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

Index.contextTypes = {
  router: PropTypes.object
};


const mapStateToProps = (state) => {
  return {
    userStatus: state.userStatus, 
    drawerState: state.drawerState,
    page: state.page}
}

export default withRouter(connect(
  mapStateToProps
  )(withRoot(withStyles(styles)(Index))))
