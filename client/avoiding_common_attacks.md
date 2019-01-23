Logic Bugs:
- Basic functionality is tested with unit tests. I wrote 36 tests.
I know that there is some tests still missing, e.g. test all the 
modifiers in all functions. 
- Followed solidity coding standards and general coding best practices.
- Avoiding overly complex or complicated implementations (even at the
cost of some extra gas).

Failed Sends:
- Only user can withdraw to own address. Only exception is emergency withdraw function which can 
be used only by contract owner. Balance states in contract are updated before calling transfer to prevent 
re-entrancy attacks.
- I should still consider using additional gas when sending funds if the funds are sent to contract based 
wallet (e.g. mist). In this case there should be additional gas to get transfer through.

Recursive Calls:
-  I implemented re-entry protector to prevent recursive calls to all external non-constant functions in 
the contract.
- Protector are added to functions that modifies that: 1.) are public, 2.) can be called someone else
that contract owner and 3.) modifies contract state.

Integer Arithmetic Overflow:
- Restricted counts that user can pass. E.g. maximum product quantity is set to 200.
- Checking pre-conditions before performing arithmetic.

Poison Data:
- Limiting the length of user-supplied data such as storefront and product names.
- Disallowed characters in names that often have special meaning in computer systems such as "<, >".

Exposed Functions:
- Exposed only functions that are properly checked and protected.
- All the other functions are introduced as private.

Exposed Secrets:
- Ensuring our contracts do not rely on any secret information.

Denial of Service / Dust Spam:
- Limiting the length of user-supplied data such as storefront and product names.
- Ensuring that a non-trivial payment is required by a user to make a change that would affect 
other users' transactions.

Miner Vulnerabilities:
- Not using block hashes.
- Not expecting a precision of better than fifteen minutes or so from block timestamps.

Malicious Creator:
- Smart contract owner can delete contract owner address from the contract. This means
that contact can't be destroyed or deactivated by anyone. 

Off-chain Safety:
- I didn't use HTTPS for the exercise. Lower priority imo from the exercise point of view.

Cross-chain Replay Attacks:
- Following blockchain scene closely. This contract will appear only on the Ethereum
Foundation Hard-Fork chain.

Tx.Origin Problem:
- Not using tx.origin for authentication at all.

Solidity Function Signatures and Fallback Data 
- Not having a fallback function that reads msg.data.

Incorrect use of Cryptography:
- Not make use of any cryptography.

Gas Limits:
- Using mostly fixed arrays instead of dynamic arrays. Only exception is users array which
I could have also done with fixed array but decided not to. Looping that array might come 
costly at some point and needs to be taken care of.
- Limiting the length of user-supplied data such as storefront and product names.

Stack Depth Exhaustion:
- Not calling other contract.

Smart check:
- Both contracts that I wrote was analyzed using static analyze
tool: https://tool.smartdec.net/newscan

Mythril:
- Unfortunatelly mythril analyze tool seems to be hanging for me 
and I didn't have time to debug why. Seems like analyze ends up
to endless loop because it's taking so long. For the future
reference, I was using following versions:

truffle version
Truffle v5.0.2 (core: 5.0.2)
Solidity v0.5.0 (solc-js)
Node v10.13.0

myth --version
Mythril version v0.19.5

solc --version
solc, the solidity compiler commandline interface
Version: 0.5.2+commit.1df8f40c.Darwin.appleclang

Stacktrace once interrupted:
 myth --truffle
^CTraceback (most recent call last):
  File "/usr/local/bin/myth", line 11, in <module>
    sys.exit(main())
  File "/usr/local/lib/python3.7/site-packages/mythril/interfaces/cli.py", line 322, in main
    mythril.analyze_truffle_project(args)
  File "/usr/local/lib/python3.7/site-packages/mythril/mythril.py", line 216, in analyze_truffle_project
    self.sigs, *args, **kwargs
  File "/usr/local/lib/python3.7/site-packages/mythril/support/truffle.py", line 59, in analyze_truffle_project
    issues = fire_lasers(sym)
  File "/usr/local/lib/python3.7/site-packages/mythril/analysis/security.py", line 20, in fire_lasers
    issues += module.execute(statespace)
  File "/usr/local/lib/python3.7/site-packages/mythril/analysis/modules/integer.py", line 36, in execute
    issues += _check_integer_overflow(statespace, state, node)
  File "/usr/local/lib/python3.7/site-packages/mythril/analysis/modules/integer.py", line 85, in _check_integer_overflow
    model = _try_constraints(node.constraints, [constraint])
  File "/usr/local/lib/python3.7/site-packages/mythril/analysis/modules/integer.py", line 145, in _try_constraints
    model = solver.get_model(constraints + new_constraints)
  File "/usr/local/lib/python3.7/site-packages/mythril/analysis/solver.py", line 26, in get_model
    result = s.check()
  File "/usr/local/lib/python3.7/site-packages/z3/z3.py", line 7298, in check
    return CheckSatResult(Z3_optimize_check(self.ctx.ref(), self.optimize))
  File "/usr/local/lib/python3.7/site-packages/z3/z3core.py", line 4014, in Z3_optimize_check
    r = _elems.f(a0, a1)
KeyboardInterrupt
