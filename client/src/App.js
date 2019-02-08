import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Typography from '@material-ui/core/Typography';
import Paper from "@material-ui/core/Paper";
import Marketplace from "./contracts/Marketplace.json";
import getWeb3 from "./utils/getWeb3";
import Index from './pages/index';
import {Actions} from './store/model'
import {connect} from 'react-redux';
import {Translator} from './utils/translator';
import ipfsClient from "ipfs-http-client";

import "./App.css";


const styles = theme => ({
  root: {
    paddingLeft: "5%",
    paddingRight: "5%",
    paddingTop: "5%",
  },
  requestPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  }
});

class App extends Component {
  state = { userStatus: -1, web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      const {ipfsLoaded} = this.props;
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Marketplace.networks[networkId];
      const instance = new web3.eth.Contract(
        Marketplace.abi,
        deployedNetwork && deployedNetwork.address,
      );

      if (instance._address !== null) {
        // Set web3, accounts, and contract to the state, and then proceed with an
        // example of interacting with the contract's methods.
        this.setState({ web3, accounts, contract: instance }, this.intialize);
        this.props.contractLoaded(instance);
        this.props.accountsLoaded(accounts);

        // load IPFS client
        var ipfs = ipfsClient('localhost', '5001', { protocol: 'http' });
        ipfs.swarm.peers(function (err) {
          if (err) {
            ipfsLoaded(false);
            console.log("IPFS daemon not found. File upload will be disabled: ", err); 
          } else {
            ipfsLoaded(ipfs);
          }
        });
      }
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  intialize = async () => {
    const { contract, accounts } = this.state;
    const userStatusResponse = await contract.methods.getUserStatus(accounts[0]).call({ from: accounts[0] });
    const userStatusInt = parseInt(userStatusResponse);
    this.setState({ userStatus: userStatusInt });
    this.props.userStatusUpdated(Translator.convertUserStatusCode(userStatusInt));
  };

  render() {
    const { classes } = this.props;
    if (this.state.contract === null) {
      return (<div className={classes.root}>
      <Paper className={classes.requestPaper} elevation={1}>
        <Typography variant="h5" component="h3">
          Contract is not found from selected network...
        </Typography>
        <Typography component="p">
          - Remember to use web3.0 compatible browser or metamask plugin.
          Learn more: https://metamask.io/ 
        </Typography>
        <Typography component="p">
          - Select Rinkeby network if you want to interact with public contract.
        </Typography>
        <Typography component="p">
          - If you're trying to set up project locally, start ganache-cli and connect
          browser to localhost:8545 (by default)
        </Typography>
      </Paper>
      </div>);
    }
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (<Index userStatus={this.state.userStatus} />);
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return {
    userStatus: state.userStatus,
    contract: state.contract,
    accounts: state.accounts
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    userStatusUpdated(userStatus){dispatch(Actions.userStatusUpdated(userStatus))},
    storefrontsFetched(storefronts){dispatch(Actions.storefrontsFetched(storefronts))},
    contractLoaded(contract){dispatch(Actions.contractLoaded(contract))},
    accountsLoaded(accounts){dispatch(Actions.accountsLoaded(accounts))},
    ipfsLoaded(ipfs){dispatch(Actions.ipfsLoaded(ipfs))}
  }
}

export default connect(
mapStateToProps,
mapDispatchToProps
)((withStyles(styles)(App)))
