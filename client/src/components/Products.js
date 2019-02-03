import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {connect} from 'react-redux';
import {Translator} from '../utils/translator';
import web3 from 'web3';
import {withRouter} from 'react-router-dom';
import Typography from '@material-ui/core/Typography';


import IconButton from '@material-ui/core/IconButton';
import AddShoppingCartIcon from '@material-ui/icons/AddShoppingCart';

import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import ListSubheader from '@material-ui/core/ListSubheader';


const styles = theme => ({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper,
    },
    gridList: {
      width: "80%",
      height: "auto",
      display: 'flex',
    },
    button: {
        margin: theme.spacing.unit,
        color: 'white',
    },
    pictureNotAdded: {
        marginLeft: theme.spacing.unit*1,
        marginTop: theme.spacing.unit*3,
        display: 'flex',
        flexWrap: 'wrap',
    }
  });

// UI limited to buy one at the time
const PURCHASE_QUANTITY = 1;

class Products extends React.Component {
    state = {
        spacing: "16",
        products: []
      };
    	
	async componentDidMount() {
        const {contract, accounts, selectedStorefront} = this.props;
        if (selectedStorefront.index < 0) {
            this.context.router.history.push("/");
          } else {
            const rawProducts = await contract.methods.getAllProductsFromStorefront(selectedStorefront.addr, selectedStorefront.index).call({from: accounts[0]});
            this.setState({ products: Translator.convertProductsData(rawProducts) });
          }
    }

    purchaseProductClicked = async (price, index) => {
        const {contract, accounts, selectedStorefront} = this.props;
        const {products} = this.state;
        const tx = await contract.methods.purchaseProduct(selectedStorefront.addr, selectedStorefront.index, index, PURCHASE_QUANTITY).send({value: price, from: accounts[0]});
        
        if (tx.events.LogPurchaseProduct) {
            const returnValues = tx.events.LogPurchaseProduct.returnValues;
            const storeOwner = returnValues.storeOwner;
            const storeIndex = parseInt(returnValues.storeIndex);
            const productIndex = parseInt(returnValues.productIndex);
            if (selectedStorefront.addr.toUpperCase() === storeOwner.toUpperCase() &&
                selectedStorefront.index === storeIndex) 
            {
                const quantity = parseInt(returnValues.quantity);
                let productsCopy = Object.assign([], products);
                productsCopy[productIndex].quantity -= quantity;
                this.setState({ products: productsCopy});
            }
          }
    }

    render() {
        const { classes } = this.props;
        const { products } = this.state;
        return (
        <div>
            <div className={classes.root}>
            <GridList cellheight={600} cols={4} className={classes.gridList}>
                <GridListTile key="Subheader" cols={4} style={{ height: 'auto' }}>
                <ListSubheader component="div">Products: </ListSubheader>
                </GridListTile>
                {products.map((product, index) => (
                <GridListTile key={index} style={classes.gridTileStyle}>
                    {product.ipfsHash.length > 0 ? 
                    <img src={"https://ipfs.io/ipfs/" + product.ipfsHash} alt={""} /> :
                    <div className={classes.pictureNotAdded}><Typography variant="h6" component="h4">
                        Picture not added :(
                    </Typography></div>}
                    <GridListTileBar
                    title={product.name}
                    subtitle={
                    <div>
                        <span>Product quantity: {product.quantity}</span><br/><br/>
                        <span>Price: {web3.utils.fromWei(product.price.toString(), "ether")} Ξ</span>
                    </div>
                    }
                    actionIcon={
                        <IconButton color="primary" className={classes.button} disabled={product.quantity === 0} onClick={() => this.purchaseProductClicked(product.price, product.index)} aria-label="Purchase product">
                            <AddShoppingCartIcon />
                        </IconButton>
                    }
                    />
                </GridListTile>
                ))}
            </GridList>
            </div>
          </div>
        );
    }
}

    Products.propTypes = {
        classes: PropTypes.object.isRequired
    };

    Products.contextTypes = {
        router: PropTypes.object
    };

    const mapStateToProps = (state) => {
        return {
            accounts: state.accounts,
            contract: state.contract,
            selectedStorefront: state.selectedStorefront
        }
    }
  
    const mapDispatchToProps = (dispatch) => {
        return {
        }
    }

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
    )(withStyles(styles)(Products)))
