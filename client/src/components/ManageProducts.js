import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Paper from "@material-ui/core/Paper";
import Button from '@material-ui/core/Button';
import {connect} from 'react-redux';
import {Translator} from '../utils/translator';
import {UsersUtil} from '../utils/users';
import web3 from 'web3';
import {withRouter} from 'react-router-dom';
import {IpfsUtil} from '../utils/ipfs';

const styles = theme => ({
    root: {
      flexGrow: 1
    },
    button: {
      margin: theme.spacing.unit,
    },
    paper: {
      padding: theme.spacing.unit * 2,
      margin: "auto",
      width: 520
    },
    addProductPaper: {
        padding: theme.spacing.unit * 2,
        margin: "auto",
        width: 400
    },
    control: {
      padding: theme.spacing.unit * 2
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
      },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 200,
    },
  });

const MAX_PRODUCT_COUNT = 10;

class ManageProducts extends React.Component {
    state = {
        spacing: "16",
        products: [],
        name: '',
        quantity: '1',
        price: '0',
        bufferedPic: "",
        picProductIndex: -1
      };

    handleChange = name => event => {
        this.setState({
          [name]: event.target.value,
        });
      };
    
    addProductClicked = async (index) => {
        const {contract, accounts, selectedStorefront} = this.props;
        const {name, quantity, price, products} = this.state;
        const validPrice = isNaN(price) || price.length === 0 ? "0" : price;
        const priceInWei = web3.utils.toWei(validPrice, "ether");
        const tx = await contract.methods.addProductToStoreFront(selectedStorefront.index, name, priceInWei, quantity).send({from: accounts[0]});
        if (tx.events.LogNewProductAdded) {
          const returnValues = tx.events.LogNewProductAdded.returnValues;
          const name = returnValues.name;
          const price = parseInt(returnValues.price);
          const quantity = parseInt(returnValues.quantity);
          let productsCopy = Object.assign([], products);
          productsCopy.push({name: name, price: price, quantity: quantity, index: productsCopy.length, ipfsHash: ""});
          this.setState({ 
            products: productsCopy,
            name: "",
            quantity: '1',
            price: '0'
          });

        }
    }

    storePicture = (event, index) => {
      const file = event.target.files[0];
      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => this.storeBufferedPicToState(reader, index);  
    };

    storeBufferedPicToState = async(reader, index) => {
        const bufferedPic = await Buffer.from(reader.result);
        this.setState({
          bufferedPic: bufferedPic,
          picProductIndex: index
        });
    };

    saveHashToContract = async(hashInBytes, index) => {
      const {contract, selectedStorefront, accounts} = this.props;
      const {products} = this.state;

      const tx = await contract.methods.updateIpfsHashForProductPic(selectedStorefront.index, index, hashInBytes).send({from: accounts[0]});
      if (tx.events.LogProductPictureIpfsHashAdded) {
        let productsCopy = Object.assign([], products);
        productsCopy[index].ipfsHash = IpfsUtil.bytes32ToIPFSHash(hashInBytes);
        this.setState({ 
          products: productsCopy,
          bufferedPic: "",
          picProductIndex: -1
        });
      }
    }

    onSubmit = async (index) => {
      const {ipfs} = this.props;
      await ipfs.add(this.state.bufferedPic, (err, ipfsHash) => {
        const hashInBytes = IpfsUtil.ipfsHashToBytes32(ipfsHash[0].hash);
        this.saveHashToContract(hashInBytes, index);
      });
    };

    async componentDidMount() {
        const {contract, selectedStorefront, accounts} = this.props;
        if (selectedStorefront.index < 0) {
          this.context.router.history.push("/");
        } else {
          const rawProducts = await contract.methods.getAllProductsFromStorefront(selectedStorefront.addr, selectedStorefront.index).call({from: accounts[0]});
          this.setState({ products: Translator.convertProductsData(rawProducts) });
        }
    }

    updateProductPriceClicked = async (index) => {
        const {contract, selectedStorefront, accounts} = this.props;
        await contract.methods.updatePrice(selectedStorefront.index, index, this.state.products[index].price).send({from: accounts[0]});
    }

    removeProductClicked = async (index) => {
        const {contract, selectedStorefront, accounts} = this.props;
        const {products, picProductIndex} = this.state;
        const tx = await contract.methods.removeProductFromStorefront(selectedStorefront.addr, selectedStorefront.index, index).send({from: accounts[0]});

        if (tx.events.LogProductRemoved) {
            const returnValues = tx.events.LogProductRemoved.returnValues; 
            const index = parseInt(returnValues.index);
            let productsCopy = Object.assign([], products);
            let productToBeMoved = products[productsCopy.length - 1];
            productToBeMoved.index = index;
            productsCopy[index] = productToBeMoved;
            productsCopy.pop();
            
            // if product that has picture upload process
            // ongoing will be removed, then initialize picture
            // variables
            if (picProductIndex === index) {
              this.setState({ 
                products: productsCopy,
                picProductIndex: -1,
                bufferedPic: ""
              });
            // if product that has picture upload process
            // ongoing was last, it was replaced with removed
            // product thus updating picProductIndex as well.
            } else if (productsCopy.length === index ) {
              this.setState({ 
                products: productsCopy,
                picProductIndex: index,
              });
            }
            
            this.setState({ products: productsCopy});
        }
    }

    updatePriceChange = index => event => {
        let productsCopy = Object.assign([], this.state.products);
        const price = event.target.value;
        const validPrice = isNaN(price) || price.length === 0 ? "0" : price;

        productsCopy[index].price = parseInt(web3.utils.toWei(validPrice, "ether"));
        this.setState({ products: productsCopy });
      };

    render() {
        const { classes, selectedStorefront, userStatus, ipfs } = this.props;
        const { spacing, products, picProductIndex } = this.state;
        const isAdmin = UsersUtil.isAdmin(userStatus);
        const isIpfsInitialized = ipfs !== false;
        var maxProductCountReached = !isAdmin && (products.length >= MAX_PRODUCT_COUNT);
        return (
        <div>
          <Paper className={classes.addProductPaper}>
          <Typography variant="h5" component="h3">
              {selectedStorefront.name}
          </Typography>
          <Typography component="p">
              Add products:
          </Typography>
        <form className={classes.container} noValidate autoComplete="off">
          <TextField
            required
            id="standard-name"
            label="Product Name"
            className={classes.textField}
            value={this.state.name}
            onChange={this.handleChange('name')}
            margin="normal"
          />
          <TextField
            id="standard-number"
            label="Quantity"
            value={this.state.quantity}
            onChange={this.handleChange('quantity')}
            type="number"
            className={classes.textField}
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
          />
          <TextField
            id="standard-number"
            label="Price in Ξ "
            value={this.state.price}
            onChange={this.handleChange('price')}
            type="number"
            className={classes.textField}
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
          />
        </form>
        <br/>
          <Button variant="contained" color="primary" disabled={maxProductCountReached} className={classes.button} onClick={() => this.addProductClicked()}>
              Add product
          </Button>
        </Paper>
        <br/>    
          <Grid container className={classes.root} spacing={16}>
            <Grid item xs={12}>
              <Grid
                container
                className={classes.demo}
                justify="center"
                spacing={Number(spacing)}
              >
                {products.map((product, index) => (
                  <Grid key={index} item>
                    <Paper className={classes.paper}>
                        <Grid container spacing={16}>
                          <Grid item xs={12} sm container>
                              <Grid item xs container direction="column" spacing={16}>
                              <Grid item xs>
                                  <Typography gutterBottom variant="subtitle1">
                                  {product.name}
                                  </Typography>
                              </Grid>
                              <Grid item>
                              <TextField
                              id="standard-name"
                              label="Price in Ξ "
                              type="number"
                              className={classes.textField}
                              value={web3.utils.fromWei(product.price.toString(), "ether")}
                              onChange={this.updatePriceChange(product.index)}
                              margin="normal"
                              />
                              </Grid>
                              <Grid item>
                              <Button variant="contained" color="primary" className={classes.button} disabled={product.quantity === 0} onClick={() => this.updateProductPriceClicked(product.index)}>
                                  Update price
                              </Button>
                              <Button variant="contained" color="secondary" className={classes.button} disabled={product.quantity === 0} onClick={() => this.removeProductClicked(product.index)}>
                                  Remove product
                              </Button>
                              </Grid>
                              </Grid>
                              <Grid item>
                                  <Typography variant="subtitle1">Product quantity: {product.quantity}</Typography>
                              </Grid>
                          </Grid>
                          <Grid item>
                            <Button
                              containerelement='label'
                              label='Add picture for product'
                              disabled={!isIpfsInitialized || product.ipfsHash.length !== 0}>
                              <input 
                                type="file"
                                onChange = {(event) => this.storePicture(event, product.index)} />
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              className={classes.button} 
                              onClick={ () => this.onSubmit(product.index)}
                              disabled={!isIpfsInitialized || product.ipfsHash.length !== 0 || picProductIndex !== product.index}>
                                  {!isIpfsInitialized ? 'IPFS node offline' : (product.ipfsHash.length === 0 ? 'Upload' : 'Uploaded!')}
                            </Button>
                          </Grid>
                        </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
          </div>
        );
    }
}
    ManageProducts.propTypes = {
      classes: PropTypes.object.isRequired
    };

    ManageProducts.contextTypes = {
        router: PropTypes.object
    };

    const mapStateToProps = (state) => {
        return {
            accounts: state.accounts,
            contract: state.contract,
            selectedStorefront: state.selectedStorefront,
            userStatus: state.userStatus,
            ipfs: state.ipfs
        }
    }
  
    const mapDispatchToProps = (dispatch) => {
        return {
        }
    }

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
    )(withStyles(styles)(ManageProducts)))
