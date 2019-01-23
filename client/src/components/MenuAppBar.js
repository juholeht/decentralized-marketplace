import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import {Actions} from '../store/model';

const drawerWidth = 250;

const styles = theme => ({
    root: {
      flexGrow: 1,
    },
    grow: {
      flexGrow: 1,
    },
    menuButton: {
      marginLeft: -12,
      marginRight: 20,
    },
    appBar_closed: {
      marginLeft: 0,
      [theme.breakpoints.up("sm")]: {
        width: `100%`
      }
    },
    appBar_open: {
      marginLeft: drawerWidth,
      [theme.breakpoints.up("sm")]: {
        width: `calc(100% - ${drawerWidth}px)`
      }
    },
    userStatus: {
        position: 'absolute',
        right: 30
    }
  });

class MenuAppBar extends React.Component {

  state = {
    open: false,
  };

  handleDrawerOpen = () => {
    let flippedValue = !this.state.open
    this.setState({ open: flippedValue });
    this.props.drawerStateUpdated(flippedValue);
  };


    render() {
      const { classes, userStatus } = this.props;
      return (
        <AppBar
          title="Decentralized Marketplace"
          iconclassnameright="muidocs-icon-navigation-expand-more"
          className={this.props.drawerState ? classes.appBar_open : classes.appBar_closed}>
              <Toolbar>
                <IconButton 
                  className={classes.menuButton} 
                  color="inherit" aria-label="Menu"
                  onClick={this.handleDrawerOpen}>
                  <MenuIcon />
                </IconButton>
                <Typography variant="h5" color="inherit">
                Decentralized Marketplace
                </Typography>
                <Typography variant="body1" color="inherit" className={classes.userStatus} >
                    Status: {userStatus}
                </Typography>
              </Toolbar> 
        </AppBar>
      );
    }
}

MenuAppBar.propTypes = {
    classes: PropTypes.object.isRequired,
  };

const mapStateToProps = (state) => {
    return {userStatus: state.userStatus,
      drawerState: state.drawerState}
}

const mapDispatchToProps = (dispatch) => {
  return {
    drawerStateUpdated(drawerState){dispatch(Actions.drawerStateUpdated(drawerState))}
  }
}

export default connect(
  mapStateToProps, mapDispatchToProps
)(withStyles(styles)(MenuAppBar))
